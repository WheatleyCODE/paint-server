import express from "express";
import expressWS from "express-ws";

const PORT = 5000;

const app = expressWS(express()).app;

app.ws("/", (ws, res) => {
  console.log("ОК");
});

app.listen(PORT, () => {
  console.log(`Server start on port: ${PORT}`);
});
