const mysql = require("mysql");
const connection = require("./connection.js");
const inquirer = require("inquirer");
const cTable = require("console.table");

class Store {
  //add department to DB
  addDepartmentDB(value) {
    connection.query(
      "INSERT INTO departments (name) VALUES  (?)",
      [value],
      (err, value) => {
        if (err) {
          console.log("Didn't work");
          throw err;
        }
      }
    );
    console.log(`The ${value} department has been added to your company.`);
  }

  //take response and add to roles table
  addRoleDB(title, salary, departmentID) {
    connection.query(
      "INSERT INTO roles (title, salary, department_id) VALUES  (?, ?, ?)",
      [title, salary, departmentID],
      (err, value) => {
        if (err) {
          console.log("Didn't work");
          throw err;
        }
      }
    );
    console.log(`The ${title} role has been added to your company.`);
  }

  //take response and add employee into employees table
  addEmployeeDB(firstName, lastName, roleId, managerId) {
    connection.query(
      "INSERT INTO employees (first_name, last_name, role_id, manager_id) VALUES  (?, ?, ?, ?)",
      [firstName, lastName, roleId, managerId],
      (err, value) => {
        if (err) {
          console.log("Didn't work");
          throw err;
        }
      }
    );
    console.log(`${firstName} ${lastName} has been added to your company.`);
  }

  //for function to view employees by department
  //prompt list of departments -> select department -> show all employees in that department -> return to main menu
  viewDepartmentsDB(callback) {
    const array = [];
    //select all department names
    connection.query("SELECT name FROM departments", (err, values) => {
      if (err) throw err;
      values.forEach((value) => {
        array.push(value.name);
      });
      inquirer
        .prompt({
          type: "list",
          name: "departSelect",
          choices: array,
        })
        .then((response) => {
          //get department id
          connection.query(
            "SELECT id FROM departments WHERE name =?",
            [response.departSelect],
            (err, data) => {
              if (err) throw err;
              //get the corresponding role IDs
              connection.query(
                "SELECT role_id FROM roles WHERE department_id =?",
                [data[0].id],
                (err, data) => {
                  if (err) throw err;
                  const searchQuery = ["id = (?)"];
                  const queryString = "OR id = (?)";
                  const searchParameters = [];

                  //use the length of the array of ids to build query string
                  //and create query parameters from ids
                  data.forEach((datus) => {
                    const i = data.indexOf(datus);
                    searchParameters.push([data[i].role_id]);
                    if (i > 0) {
                      searchQuery.push(queryString);
                    }
                  });
                  //https://stackoverflow.com/questions/10610402/javascript-replace-all-commas-in-a-string
                  const revisedSearchQuery = searchQuery
                    .join(",")
                    .replace(/,/g, " ");
                  //serach for all the employees who have a role_id that corresponds to department id selected earlier
                  connection.query(
                    `SELECT first_name, last_name, id FROM employees WHERE ${revisedSearchQuery}`,
                    searchParameters,
                    (err, employees) => {
                      if (err) throw err;
                      console.table(employees);
                      //callback function to return to main menu
                      callback();
                    }
                  );
                }
              );
              //
            }
          );
        });
    });
  }

  //to view roles from
  viewRolesDB(callback) {
    //get all titles
    connection.query("SELECT title FROM roles", (err, roles) => {
      if (err) throw err;
      const allRoles = [];
      roles.forEach((role) => {
        allRoles.push(role.title);
      });
      const selectRole = [
        {
          type: "list",
          name: "selectRole",
          message: "Select which roles's employees you'd like to view",
          choices: allRoles,
        },
      ];
      //get role id
      inquirer.prompt(selectRole).then((response) => {
        connection.query(
          "SELECT role_id FROM roles WHERE title = ?",
          [response.selectRole],
          (err, roleID) => {
            if (err) throw err;
            connection.query(
              //find employees by role_id
              //add to array
              //console.table it
              "SELECT first_name, last_name FROM employees WHERE role_id = ?",
              [roleID[0].role_id],
              (err, employeesByRole) => {
                if (err) throw err;
                const employeeName = [];
                employeesByRole.forEach((employee) => {
                  employeeName.push([
                    `${employee.first_name}`,
                    `${employee.last_name}`,
                  ]);
                });
                console.table(["First Name", "Last Name"], employeeName);
                callback();
              }
            );
          }
        );
      });
    });
  }

  //select all employees and display
  viewEmployeesDB(callback) {
    connection.query(
      "SELECT employees.id, employees.first_name, employees.last_name, employees.role_id, employees.manager_id, roles.title, roles.salary, roles.department_id FROM employees LEFT JOIN roles ON employees.role_id = roles.role_id",
      (err, employees) => {
        if (err) throw err;
        console.table(employees);
        callback();
      }
    );
  }
}

module.exports = new Store();
