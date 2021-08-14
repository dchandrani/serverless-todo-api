'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.hello = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Hello from Dhruv!',
      },
      null,
      2
    ),
  };
};

module.exports.createTodo = async (event) => {
  const { text = "" } = JSON.parse(event.body);

  const id = uuid.v1();

  const timestamp = new Date().getTime();

  const params = {
    TableName: process.env.TODO_TABLE,
    Item: {
      id: id,
      text: text,
      checked: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  };

  const data = await dynamoDb.put(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify(
      params.Item,
      null,
      2
    ),
  };
};

module.exports.getAllTodos = async (event) => {
  const params = {
    TableName: process.env.TODO_TABLE,
  };

  const data = await dynamoDb.scan(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        todos: data.Items,
      },
      null,
      2
    ),
  };
};

module.exports.deleteTodo = async (event) => {
  const params = {
    TableName: process.env.TODO_TABLE,
    Key: {
      id: event.pathParameters.id,
    }
  };

  const data = await dynamoDb.delete(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Todo deleted successfully',
      },
      null,
      2
    ),
  };
};

module.exports.getTodoById = async (event) => {
  const params = {
    TableName: process.env.TODO_TABLE,
    Key: {
      id: event.pathParameters.id,
    }
  };

  const todo = await dynamoDb.get(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify(
      todo.Item,
      null,
      2
    ),
  };
};

module.exports.updateTodo = (event, context, callback) => {
  const timestamp = new Date().getTime();
  const data = JSON.parse(event.body);

  // validation
  if (typeof data.checked !== 'boolean') {
    console.error('Validation Failed');
    callback(null, {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'message': 'Couldn\'t update the todo item.',
      }, null, 2),
    });
    return;
  }

  const params = {
    TableName: process.env.TODO_TABLE,
    Key: {
      id: event.pathParameters.id,
    },
    ExpressionAttributeNames: {
      '#todo_text': 'text',
    },
    ExpressionAttributeValues: {
      ':text': data.text,
      ':checked': data.checked,
      ':updatedAt': timestamp,
    },
    UpdateExpression: 'SET #todo_text = :text, checked = :checked, updatedAt = :updatedAt',
    ReturnValues: 'ALL_NEW',
  };

  // update the todo in the database
  dynamoDb.update(params, (error, result) => {
    // handle potential errors
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          'message': 'Couldn\'t fetch the todo item.',
        }, null, 2),
      });
      return;
    }

    // create a response
    const response = {
      statusCode: 200,
      body: JSON.stringify(result.Attributes, null, 2),
    };
    callback(null, response);
  });
};