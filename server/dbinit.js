let settings = {
    dbName: "ligerbotscarpool",
    maxStrLen: 1000
}
let mysql = require("mysql");

function init(con) {
    {
        let qry = `
            CREATE DATABASE IF NOT EXISTS ${settings.dbName};
        `
        con.query(qry, (err) => {
            if (err) throw err;
        });
    }
    {
        con.changeUser({database: settings.dbName}, (err) => {
          if (err) throw err;
        });
    }
    {
        let qry = `
            CREATE TABLE IF NOT EXISTS events (
              id int NOT NULL auto_increment,
              title varchar(${settings.maxStrLen})  NOT NULL default "",
              note varchar(${settings.maxStrLen})  NOT NULL default "",

              date TIMESTAMP NOT NULL,
              defaultDepartingTime varchar(${settings.maxStrLen}) NOT NULL,
              defaultReturningTime varchar(${settings.maxStrLen}) NOT NULL,

              PRIMARY KEY  (id)
            ) CHARACTER SET utf8mb4;
        `
        con.query(qry, (err) => {
            if (err) throw err;
        });
    }
    {
        let qry = `
            CREATE TABLE IF NOT EXISTS carpools (
              id int NOT NULL auto_increment,
              eventId int NOT NULL,
              driverId int NOT NULL,

              name varchar(${settings.maxStrLen}) NOT NULL default "",
              origin varchar(${settings.maxStrLen}) NOT NULL default "",
              departingTime varchar(${settings.maxStrLen}) NOT NULL default "",
              returningTime varchar(${settings.maxStrLen}) NOT NULL default "",
              seats int NOT NULL default 4,
              trip int NOT NULL,
              note varchar(${settings.maxStrLen}) NOT NULL default "",
              PRIMARY KEY  (id)
            ) CHARACTER SET utf8mb4;
        `
        con.query(qry, (err) => {
            if (err) throw err;
        });
    }
    {
        let qry = `
            CREATE TABLE IF NOT EXISTS participants (
              id int NOT NULL auto_increment,
              carpool_departing_type int NOT NULL,
              carpool_departing_carpoolId int NOT NULL,
              carpool_returning_type int NOT NULL,
              carpool_returning_carpoolId int NOT NULL,
              carpool_drivingCarpool int,

              eventId int NOT NULL,

              personalInformation_name varchar(${settings.maxStrLen})  NOT NULL default "",
              personalInformation_email varchar(${settings.maxStrLen})  NOT NULL default "",
              personalInformation_number varchar(${settings.maxStrLen})  NOT NULL default "",
              personalInformation_note varchar(${settings.maxStrLen})  NOT NULL default "",
              PRIMARY KEY (id)
            ) CHARACTER SET utf8mb4;
        `
        con.query(qry, (err) => {
            if (err) throw err;
        });
    }
}
let con = mysql.createConnection({
    host: "127.0.0.1",
    user: "ligerbots-carpool",
    password: "PASSWORD",
    charset : 'utf8mb4',
});
con.connect((err) => {
    if (err) throw err;
    console.log("Connected!");
});
init(con);

con.end((err) => {});
