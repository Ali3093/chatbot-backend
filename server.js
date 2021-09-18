require('dotenv').config();
const express = require('express');
const app = express();
const userRouter = require('./apis/router');

app.use(express.json());
app.use('/',userRouter); 

app.listen(process.env.APP || 5000, () => {                     //app.listen(5000,function() {})
    console.log("server up and running on PORT:",process.env.PORT );
});


