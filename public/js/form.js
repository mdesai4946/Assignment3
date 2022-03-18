function submit()
{
    return true;
    var receipt='';
    var errors='';

    var name = document.getElementById('customername').value;
    var address = document.getElementById('address').value;
    var city = document.getElementById('city').value;
    var province = document.getElementById('province').value;
    
    var email = document.getElementById('email').value;

    if(name=="" || address=="" || city=="" || province =="")
    {
        document.getElementById("errors").innerHTML= "Please Fill Customer's Name , Address , City & Province to proceed further !";
    }
    var regPhone = /^[0-9]{10}$/;
    var Phonenumber = document.getElementById("number").value;
    {
    if(regPhone.test(Phonenumber))
        document.getElementById("number").innerHTML = `${Phonenumber}`;
    else
    document.getElementById("errors").innerHTML= "Please enter valid phone number";
    }
 
}