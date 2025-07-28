const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

// MySQL configuration from .env
const dbConfig = {
    host: process.env.DB_SERVER,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    multipleStatements: true
};

async function runSqlFile(connection, filePath) {
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    try {
        await connection.query(sqlContent);
        console.log(`Executed: ${path.basename(filePath)}`);
    } catch (err) {
        console.error(`Error executing ${path.basename(filePath)}:`, err.message);
    }
}

async function main() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('MySQL database connection successful!');
        // Run MySQL schema files
        await runSqlFile(connection, path.join(__dirname, 'schema', 'create_users_table.mysql.sql'));
        await runSqlFile(connection, path.join(__dirname, 'schema', 'create_transactions_table.mysql.sql'));
        await runSqlFile(connection, path.join(__dirname, 'schema', 'create_banks_table.mysql.sql'));
        await runSqlFile(connection, path.join(__dirname, 'schema', 'create_send_receive_table.mysql.sql'));
        await runSqlFile(connection, path.join(__dirname, 'schema', 'create_ticket_table.mysql.sql'));
        await runSqlFile(connection, path.join(__dirname, 'schema', 'create_ticket_reply_table.mysql.sql'));
        console.log('All MySQL schema files executed.');
        await connection.end();
        process.exit(0);
    } catch (err) {
        console.error('MySQL database connection failed:', err.message);
        if (connection) await connection.end();
        process.exit(1);
    }
}

main();
