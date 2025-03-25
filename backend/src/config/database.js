const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
  database: 'tsdb',
  username: 'tsdbadmin',
  password: 'im0samw2z9znk6wx',
  host: 'ye2k1c2vo8.hqdaauvzv5.tsdb.cloud.timescale.com',
  port: 30484,
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: false
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('TimescaleDB connection established successfully.');
    
    // Test the connection with a simple query
    const [results] = await sequelize.query('SELECT version()');
    console.log('Database version:', results[0].version);
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB }; 