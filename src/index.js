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

app.listen(3031)