require('dotenv').config();
const express = require('express');
const app = express();
const userRouter = require('./apis/router');
const server_port = process.env.PORT || 5000 ;

app.use(express.json());
app.use('/',userRouter); 

app.listen(server_port, () => {                     //app.listen(5000,function() {})
    console.log("server up and running on PORT:",process.env.PORT );
});


