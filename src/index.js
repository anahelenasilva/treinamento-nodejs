const { response } = require('express')
const express = require('express')
const { v4: uuidV4 } = require('uuid')

const app = express()
app.use(express.json())

const customers = []

//Middleware
function verifyIfAccountCpfExists (request, response, next) {
    const { cpf } = request.headers
    const customer = customers.find(c => c.cpf === cpf)

    if (!customer) {
        return response.status(400).json({ error: 'Customer not found' })
    }

    request.customer = customer //usado para recuperar nas rotas que usam o middleware
    return next()
}

function getBalance (statement) {
    const balance = statement.reduce((total, operation) => {
        if (operation.type === 'credit') {
            return total + operation.amount
        }
        else if (operation.type === 'debit') {
            return total - operation.amount
        }
        else {
            return 0;
        }
    }, 0)

    return balance
}


/*
    cpf - string
    name - string
    id - uuid
    statement - []
*/
app.post('/account', (request, response) => {
    const { cpf, name } = request.body
    const id = uuidV4()

    const customerAlreadyExists = customers.some(customer => customer.cpf === cpf)
    if (customerAlreadyExists) {
        return response.status(400).json({ error: 'Customer already exists' })
    }

    customers.push({
        cpf,
        name,
        id,
        statement: []
    })

    return response.status(201).send()
})

app.get('/statement', verifyIfAccountCpfExists, (request, response) => {
    return response.json(request.customer.statement)
})

app.post('/deposit', verifyIfAccountCpfExists, (request, response) => {
    const { description, amount } = request.body
    const customer = request.customer

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: 'credit'
    }

    customer.statement.push(statementOperation)
    return response.status(201).send()
})

app.post('/withdraw', verifyIfAccountCpfExists, (request, response) => {
    const { amount } = request.body
    const { customer } = request
    const balance = getBalance(customer.statement)

    if (balance < amount) {
        return response.status(400).json({ error: 'Insufficient funds' })
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: 'debit'
    }

    customer.statement.push(statementOperation)
    return response.status(201).send()
})

app.put('/account', verifyIfAccountCpfExists, (request, response) => {
    const { name } = request.body
    const { customer } = request

    customer.name = name
    return response.status(200).send()
})

app.get('/account', verifyIfAccountCpfExists, (request, response) => {
    const { customer } = request
    return response.status(200).send(customer)
})

app.delete('/account', verifyIfAccountCpfExists, (request, response) => {
    const { customer } = request
    customers.splice(customer, 1)
    return response.status(200).json(customers)
})

app.listen(3031)