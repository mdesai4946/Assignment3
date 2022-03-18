const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');
const session = require('express-session');
const {check, validationResult} = require('express-validator');
const { RSA_PSS_SALTLEN_DIGEST } = require('constants');

mongoose.connect('mongodb://localhost:27017/tinycake',
{
    useNewUrlParser : true,
    useUnifiedTopology : true
});

const Order = mongoose.model('Order',
{
    cname : String,
    address : String,
    city : String,
    province : String,
    number : String,
    email : String,
    flavour : String,
    myImagename : String,
    description : String,
    total : Number
});

const Admin = mongoose.model('Admin',
{
    username : String,
    password : String
});


var myApp=express();

myApp.use(express.urlencoded({extended:true}));

myApp.set('views',path.join(__dirname,'views'));
myApp.use(express.static(__dirname + '/public'));
myApp.set('view engine','ejs');
myApp.use (express.static(__dirname + '/public'));
myApp.use( express.static( "public" ));
myApp.use(fileUpload());

myApp.use(session({
    secret:'randomsecret',
    resave : false,
    saveUninitialized : true
}));

var numberRegex = /^\d{10}$/; // 1231231234
function checkRegex(userInput, regex)
{
    if (regex.test(userInput))
    {
        return true;
    }
    else
    {
        return false;
    }
}

function customPhoneValidation (value)
{
    if (!checkRegex(value, numberRegex))
    {
        throw new Error ('Please enter correct format: 1231231234');
    }
    return true;
}

myApp.get('/',function(req,res)
{
    res.render('home');
});

myApp.post('/placeorder',[
    check ('cname','Customer Name is required').notEmpty(),
    check ('address','Address is required').notEmpty(),
    check ('city','City is required').notEmpty(),
    check ('province','Province Name is required').notEmpty(),
    check ('number', '').custom(customPhoneValidation),
    check ('email','Email id is required').isEmail(),
    check('flavour','Please select any one flavour').notEmpty(),
    check('description','Please enter some description'), 
    check('myImage','') 
], function(req,res) 
{
    const errors = validationResult(req);
    console.log(errors);
    if(!errors.isEmpty())
    {
        res.render('placeorder',
        {
            errors:errors.array()
        })
    }
    else 
    {
    var cname = req.body.cname;
    var address = req.body.address;
    var city = req.body.city;
    var province = req.body.province;
    var number = req.body.number;
    var email = req.body.email;
    var flavour = req.body.flavour;
    var description = req.body.description;
    var myImagename = req.files.myImage.name;
    var myImagefile = req.files.myImage;
    var myImagepath = 'public/uploads/' + myImagename;

    myImagefile.mv(myImagepath, function(err){
       console.log(err);
    });


    var pagedata = 
    {
        cname : cname,
        address : address,
        city : city,
        province : province,
        number : number,
        email : email,
        flavour : flavour,
        description : description,
        myImagename : myImagename
    }
        var myOrder = new Order(pagedata);

        myOrder.save().then(function()
        {
            console.log('New Order Created');
        });

        res.render('placeorder',pagedata);
    } 
}); 


myApp.get('/placeorder',function(req,res)
{
    if(req.session.userLoggedIn){
    Order.find({}).exec(function (err,orders)
    {
        console.log(err);
        res.render('placeorder',{orders : orders});
    });
    }
    else
    {
        res.redirect('/login');
    }
});

myApp.get('/login',function(req,res){
    res.render('login');
});

myApp.get('/allorders',function(req,res)
{
    if(req.session.userLoggedIn){
    Order.find({}).exec(function (err,orders)
    {
        console.log(err);
        res.render('allorders',{orders : orders});
    });
    }
    else
    {
        res.redirect('/login');
    }
});


myApp.post('/login',function(req,res){
    var user =req.body.username;
    var pass = req.body.password;
    //console.log(user);
    //console.log(pass);

    Admin.findOne({username : user,password : pass}).exec(function(err,admin){
        console.log('Errors : ' + err);
        console.log('Admin:' + admin);
        if(admin)
        {
            req.session.username = admin.username;
            req.session.userLoggedIn = true;

            res.redirect('/placeorder');
        }
        else
        {
            res.render('login',{error : "sorry login failed!"});
        }
    });
});

myApp.get('/logout',function(req,res){
    req.session.username = '';
    req.session.userLoggedIn = false;
    res.render('login',{error:"Successfully logged out"});
});

myApp.get('/delete/:id',function(req,res){
    if(req.session.username){
        var objid = req.params.id;
        Order.findByIdAndDelete({_id : objid}).exec(function (err,order){
            console.log("Error:" + err);
            console.log("Order:" + order);
            if(order){
                res.render('delete',{message : "Successfully Deleted !"});
            }
            else{
                res.render('delete',{message : "Sorry record not Deleted !"});
            }
        });
    }
    else{
        res.redirect('/login');
    }
});


myApp.get('/edit/:id',function(req,res){
    if(req.session.username){
        var objid = req.params.id;
        Order.findOne({_id : objid}).exec(function (err,order){
            console.log("Error:" + err);
            console.log("Order:" + order);
            if(order){
                res.render('edit',{order:order});
            }
            else{
                res.send('No order found with this id..');
            }
        });
    }
    else{
        res.redirect('/login');
    }
});


myApp.post('/edit/:id',[
    check ('cname','Customer Name is required').notEmpty(),
    check ('address','Address is required').notEmpty(),
    check ('city','City is required').notEmpty(),
    check ('province','Province Name is required').notEmpty(),
    check ('number', '').custom(customPhoneValidation),
    check ('email','Email id is required').isEmail(),
    check('flavour','Please seelct any one flavour').notEmpty(),
    check('description','Please enter some description').notEmpty(),
   
  
], function(req,res) 
{
    const errors = validationResult(req);
    console.log(errors);

    if(!errors.isEmpty())
    {
        var id = req.params.id;
        Order.findOne({_id : id}).exec(function (err,order){
            console.log("Error:" + err);
            console.log("Order:" + order);
            if(order){
                res.render('edit',{order:order , errors:errors.array()});
            }
            else{
                res.send('No order found with this id..');
            }
    });
        
}
    else 
    {

    var cname = req.body.cname;
    var address = req.body.address;
    var city = req.body.city;
    var province = req.body.province;
    var number = req.body.number;
    var email = req.body.email;
    var flavour = req.body.flavour;
    var description = req.body.description;
    //var myImagename = req.files.myImage.name;

    
    var pagedata = 
    {
        cname : cname,
        address : address,
        city : city,
        province : province,
        number : number,
        email : email,
        flavour : flavour,
        description : description,
        
    }
        var id=req.params.id;
        Order.findOne({_id : id}, function(err, order){
            order.cname = cname;
            order.address = address;
            order.city = city;
            order.province = province;
            order.number = number;
            order.email = email;
            order.flavour = flavour;
            order.description = description;
     
            order.save();
        });

        res.render('editsucess',pagedata);
    } 
}); 


myApp.listen(5051);

console.log('Execution complete. You can open website now!');

