require('dotenv').config()
var mysql = require("mysql");
var inquirer = require("inquirer");
var connection = mysql.createConnection({ //this variable creates the connection information for the sql database
    host: process.env.DB_HOST,
    port: 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: "bamazon"
});
//=========================================================================
connection.connect(function(err) { //this function connects the mysql server & the sql database together
    if (err) throw err;
    start();
});
//=========================================================================
function start() { //this function is showing the list of products, their id's, name, quantity, etc. to the user
    connection.query("Select * From products", function(err, res) {
    if(err) throw err;
    console.log("Welcome to Bamazon! Here is what we have in store today!", 
        "\nThey are listed by the item's id #, the product's name, the department its in, the price & the quantity in stock.",
        "\nIf you wanna EXIT the store press [ctrl + key 'C']",
         "\n--------------------------");
    for(var i = 0; i < res.length; i++) {
        console.log("Item Id: " + res[i].item_id + "\nItem Name: " + res[i].product_name + "\nDepartment: " + res[i].department_name + "\nPrice: " + "$" + res[i].price + "\nStock: " + res[i].stock_quantity + "\n--------------------------");
        }   
    });
    purchase();
}
//==========================================================================
function purchase() { //--this function makes user select item from the list
    connection.query("Select * From products Where item_id", function (err, res) {
        if(err) throw err;
        inquirer.prompt({
            name: "choice",
            type: "rawlist",
            choices: function() { //--this makes the list of obejects into a selectable array for user to choose from
                let choiceArr = [];
                for(var i =0; i < res.length; i++) {
                    choiceArr.push(res[i].product_name);
                }
                return choiceArr;
            },
            message: "What do you want to buy?"
        }).then(function(chosenItem) { //--this part then asks the user how many of selected item user wants to buy
            for(var i =0; i < res.length; i++) {
                if(res[i].product_name == chosenItem.choice) {
                    let selection = res[i]; //--saves the selected item
                    // console.log(selection);
                    inquirer.prompt({
                        name: "stock",
                        type: "input",
                        message: "How many of this item do you want to buy?",
                        validate: function(answer) {
                        if(isNaN(answer) === false) { 
                        return true;
                        }
                        return false;
                        }
                    }).then(function(cart) { //--this makes sure the selected amount of product is more than whats in stock
                        // console.log(selection.price, cart.stock);
                        let subtract = parseInt(cart.stock);
                        let totalPrice = subtract * selection.price;
                        if(selection.stock_quantity >= subtract) {
                            console.log("In Your Cart: " + selection.product_name + "| How Many: " + cart.stock + "| Price (for each): $" + selection.price + "| Total Price: $" + totalPrice);
                            inquirer.prompt({
                                name: "confirmation",
                                type: "confirm",
                                message: "Do you want to move forward to checkout with your order?"
                            }).then(function(checkout) {
                                if(checkout.confirmation) {
                                    // console.log(selection);
                                    connection.query("Update products Set ? Where ?", //--here is where we update the database with the user's purchase
                                    [{
                                        stock_quantity: selection.stock_quantity -= subtract
                                    },
                                    {
                                        item_id: selection.item_id
                                    }
                                    ])
                                    console.log("Your purchase today: " + selection.product_name + " :" + cart.stock + " Total: $" + totalPrice,"\nThank you for your purchase. Come back soon!",
                                    "\n--------------------------");
                                    setTimeout(purchase, 2000);
                                } else {
                                    console.log("----You selected no. Try again.")
                                    purchase();
                                }   
                            })
                        }  else {
                            console.log("----Sorry, we dont have enough of that item in stock to fullfil your order. Try again.")
                            purchase();
                        }  
                    })
                }   
            }
        })
    })
}
//=========================================================================