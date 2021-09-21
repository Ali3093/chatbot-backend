
const express = require('express');
let router = express.Router();
const { WebhookClient } = require('dialogflow-fulfillment');
const db = require('./dbdetails');
const cs = db.collection("Customers");
const ts = db.collection("Transactions");
const moment = require('moment');

router.post('/',async(req,res) => {
  const agent = new WebhookClient({
    request : req,
    response : res,
   });
   //console.log('Dialogflow Request headers: ' + JSON.stringify(req.headers));
   //console.log('Data passed as chatContext from Kommunicate is: ' +  req.body.originalDetectIntentRequest.payload.email);
  const email = req.body.originalDetectIntentRequest.payload.email;
  
   //----------------------function fetch to IBAN and BIC----------------------------------------------------------
   async function getbicNiban(agent){
   const Qsnapshot = await cs.where('Email ID','==',email).get();
   const getList = Qsnapshot.docs.map((doc) => ({id:doc.id,...doc.data()}));
    var obj = 
      {
       "IBAN" : getList[0].IBAN,
       "BIC" : getList[0].BIC
      }
     agent.add('Your IBAN is : '+obj.IBAN + ' and BIC is : '+obj.BIC);
    }
    //-------------------------function to fetch Beneficiary-------------------------------------------------------------
    async function getBeneficiary(agent) 
    {
      const Qsnapshot = await cs.where('Email ID','==',email).get();
      const getList = Qsnapshot.docs.map((doc) => ({id:doc.id,...doc.data()}));
      var bn = 
      {
        "BENEFICIARY 1" : getList[0]['Beneficiary-1'],
        "BENEFICIARY 2" : getList[0]['Beneficiary-2'] ,
        "BENEFICIARY 3" : getList[0]['Beneficiary-3']

      }
      agent.add('Your Beneficiaries are : '+bn['BENEFICIARY 1']+', '+bn['BENEFICIARY 2']+' and '+bn['BENEFICIARY 3']);
    }
    //-------------------------function to fetch latest Balance-----------------------------------------------------------
    async function getBalance(agent)
    {
      console.log(email);
      let str = agent.parameters.account;
      var acc = str.substr(0,7);
      console.log(acc);
      const Qsnapshot = await ts.where('Email ID','==',email).where('Account Type','==',acc).orderBy('Date','desc').get();

      if(Qsnapshot.empty)
      {
        agent.add('You do not have a ' +acc+ ' account');
      }
       else
       {
        const getList = Qsnapshot.docs.map((doc) => ({id:doc.id,...doc.data()}));
        console.log(getList);  
        let bal = 
        {
          "BALANCE" : getList[0]['Current Balance']
        } ;
        agent.add('Your Current Balance is : '+bal.BALANCE);
      }
      
    }
    //-------------function to fetch total Earnings(credit)for any month/day(including current)--------------------------------------------------------------
    async function getTotalEarnings(agent)
    {
      let str = agent.parameters.account; 
      var acc = str.substr(0,7);
      var d1 = agent.parameters['date-time']['startDate'].split('T')[0];
      var d2 = agent.parameters['date-time']['endDate'].split('T')[0];
      let start = new Date(d1);
      let end = new Date(d2);
      let total = 0;
      const Qsnapshot = await ts.where('Email ID','==',email).where('Account Type','==',acc).where('Transfer type','==','credit').where('Date','>',start).where('Date','<=',end).get();
      if(Qsnapshot.empty)
      {
        agent.add('You do not have any earnings for this month');
      }
      else{
      const getList = Qsnapshot.docs.map((doc) => ({id:doc.id,...doc.data()}));
      for( let i=0;i<getList.length;i++)
      {
       total += getList[i].Amount;
      }
      agent.add('Your Total Earnings for the given period is : '+total);
    
    }
  }
    //----------------function to fetch total Expenditure(debit)for any month/day(including current)------------------------------------------------------------
    async function getTotalExpenses(agent)
    {
      let str = agent.parameters.account; 
      var acc = str.substr(0,7);
      var d1 = agent.parameters['date-time']['startDate'].split('T')[0];
      var d2 = agent.parameters['date-time']['endDate'].split('T')[0];
      let start = new Date(d1);
      let end = new Date(d2);
      var r1 = agent.parameters.name;
      let rec = new String(r1);
      var total = 0;
      const Qsnapshot = await ts.where('Email ID','==',email).where('Account Type','==',acc).where('Transfer type','==','debit').where('Date','>',start).where('Date','<=',end).get();
      if(Qsnapshot.empty)
      {
        agent.add('You do not have any expenses for this month');
      }
      else{
      const getList = Qsnapshot.docs.map((doc) => ({id:doc.id,...doc.data()}));
      console.log(getList);
      for( let i=0;i<getList.length;i++)
      {
        if(getList[i].Merchant.split(" ")[0] == rec && rec != null)
        {
          total += getList[i].Amount;
          //agent.add('You paid : '+total+ ' to '+getList[i].Merchant);
    
        }
        else 
        {
           total += getList[i].Amount;
        }

        console.log(total); 
      }

      agent.add('You spent : '+total);
    }
  }
   //---------------function to fetch mini statement-------------------------------------------------------------------
    async function getMiniStatement(agent)
    {
      let str = agent.parameters.account; 
      var acc = str.substr(0,7);
      const Qsnapshot = await ts.where('Email ID','==',email).where('Account Type','==',acc).orderBy('Date','desc').limit(5).get();
      if(Qsnapshot.empty)
      {
        agent.add('You do not have any past transactions for this month');
      }
      else{
      const getList = Qsnapshot.docs.map((doc) => (doc.data()));
        let newArr = getList.map(function(element){
          return ('DATE : ' + (new  Date(Number(element.Date))) + ' ' + //as other timestamp to date conversions did not work
          'TRANSACTION ID : ' + element['Transaction ID'] + ' ' +
          'TRANSFER TYPE : ' + element['Transfer type'] + ' ' +
          'MERCHANT : ' + element.Merchant + ' ' +
          'AMOUNT : ' + element.Amount + ' ' +
          'BALANCE : ' + element['Current Balance'] +'\r\n') ;
        });
        console.log(newArr);
        agent.add('Here is your last 5 transaction summary :' +newArr);
      //})  
    }
  }
    //======================================functions for PUT/POST requests==============================================
    //----------------------function for changing passwords (PUT)------------------------------------------------------
    // async function updatePassword(agent)
    // {
    //   let p1 = agent.parameters['Password'];
    //   await cs.where('Email ID','==',email).get()
    //   .then(Qsnapshots => {
    //    if (Qsnapshots.size > 0) {
    //     Qsnapshots.forEach(cust => {
    //     cs.doc(cust.id).update({ 'Password': p1 })
    //     agent.add('Your Password was updated successfully !');
    //     })
    // }
    // })
    // }
    //-------------------------function for Updating Phone numbers(PUT)--------------------------------------------------
    async function updatePhoneNo(agent)
    {
      let p1 = agent.parameters['phone-number'];
      let ph = parseInt(p1);
     await cs.where('Email ID','==',email).get()
      .then(Qsnapshots => {
       if (Qsnapshots.size > 0) {
        Qsnapshots.forEach(cust => {
        cs.doc(cust.id).update({ 'Phone no': ph })
        agent.add('Your Phone Number was updated successfully !');
      })
    }
    })
    }
    //--------------------------function for Updating Address(PUT)------------------------------------------------------- 
    async function updateAddress(agent)
    {
      let ad1 = agent.parameters.address;
      await cs.where('Email ID','==','arpaul@gmail.com').get()
      .then(Qsnapshots => {
       if (Qsnapshots.size > 0) {
        Qsnapshots.forEach(cust => {
        cs.doc(cust.id).update({ 'Address': ad1 })
        agent.add('Your Address was updated successfully to ');
        })
    }
    })
    }
    //------------------------------------------function for current date---------------------------------------------------

    function currentDate()
    {
      var currentD = new Date(); 
      var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
      var DT = days[currentD.getDay()]+ " " + currentD.getDate() + "/"
      + (currentD.getMonth()+1)  + "/" 
      + currentD.getFullYear() + " "  
      + currentD.getHours() + ":"  
      + currentD.getMinutes() + ":" 
      + currentD.getSeconds()

      agent.add('Today is : '+DT);
    }



    var intentMap = new Map();
    intentMap.set('account.BICandIBAN',getbicNiban);
    intentMap.set('account.Beneficiary',getBeneficiary);
    intentMap.set('account.balance.check',getBalance);
    intentMap.set('account.earning.check',getTotalEarnings);
    intentMap.set('account.spending.check',getTotalExpenses);
    intentMap.set('account.miniStatement',getMiniStatement);
    intentMap.set('account.phoneNoChange',updatePhoneNo);
    intentMap.set('account.AddressChange',updateAddress);
    intentMap.set('Today',currentDate);
    //intentMap.set('account.passwordChange',updatePassword);
    console.log(agent.handleRequest(intentMap));
});
   
  module.exports = router;