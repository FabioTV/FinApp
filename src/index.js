const express = require("express");
const {v4: uuidv4} = require("uuid");

const app = express();

app.use(express.json());

const customers = [];

function verifyIfExistAccountCPF(request, response, next){
    const { cpf } = request.headers;
    
    const customer = customers.find((customer)=> customer.cpf === cpf);

    if (!customer) {
        return response.status(400).json({error: "Customer not found!"});
    }

    request.customer = customer;

    return next();
}

function getBalance(statement){
    const balance = statement.reduce((acc, operation) =>{
        if (operation.type === 'credit') return acc += operation.amount;
        else return acc -= operation.amount;
    }, 0);

    return balance;
}

/**
 * Cadastro de conta
 * cpf - string
 * name - string
 * id - uuid
 * statement - []
 */
app.post("/account", (request,response)=>{
    const {cpf, name} = request.body;

    const isAccountAvailable = customers.some(
        (customer)=> customer.cpf === cpf
    );

    if(isAccountAvailable){
        return response.status(400).json({error: "CPF already exists!"});
    }

    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: []
    });

    return response.status(201).send();
});

app.get("/statement", verifyIfExistAccountCPF, (request,response) => {
    const { customer } = request;
    return response.json(customer.statement);
});

app.post("/deposit", verifyIfExistAccountCPF, (request, response) =>{
    const { customer } = request;
    const { description, amount} = request.body;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    };

    customer.statement.push(statementOperation);

    return response.status(201).send();
});

app.post("/withdraw", verifyIfExistAccountCPF, (request, response)=>{
    const { amount } = request.body;
    const customer = request.customer;
    const balance = getBalance(customer.statement);

    if (balance < amount){
        return response.status(401).json({error: "Isufficient funds!"});
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit"
    };

    customer.statement.push(statementOperation);

    return response.status(201).send();
});

app.listen(3333);