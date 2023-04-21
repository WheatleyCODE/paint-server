import express from "express";
import expressWS from "express-ws";
import sizeOf from "buffer-image-size";
import cors from "cors";
import path from "path";
import fs from "fs";
import bodyParser from "body-parser";
import { CANVAS_START_STR } from "./consts/image.consts";
import { SocketMethods } from "./types/socket.interfaces";

const PORT = 5000;
const { app, getWss } = expressWS(express());
const wss = getWss();

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(cors());
app.use(express.json());

app.ws("/", (ws) => {
  ws.on("message", (msg: any) => {
    const message = JSON.parse(msg);

    switch (message.method) {
      case SocketMethods.CONNECTION:
        connectionHandler(ws, message);
        break;
      case SocketMethods.CLEAR:
      case SocketMethods.RESIZE:
      case SocketMethods.SELECT:
      case SocketMethods.PUSH_UNDO:
      case SocketMethods.DRAW:
      case SocketMethods.UNDO:
      case SocketMethods.REDO:
        broadcastConnection(ws, message);
        break;
    }
  });
});

app.post("/image", (req, res) => {
  try {
    const data = req.body.image.replace(CANVAS_START_STR, "");

    fs.writeFileSync(
      path.resolve(__dirname, "files", `${req.query.id}.jpg`),
      data,
      "base64"
    );

    return res.status(200).json({ message: "Загружено" });
  } catch (e) {
    return res.status(500).json("error");
  }
});

app.get("/image", (req, res) => {
  try {
    const file = fs.readFileSync(
      path.resolve(__dirname, "files", `${req.query.id}.jpg`)
    );

    const { width, height } = sizeOf(file);
    const image = CANVAS_START_STR + file.toString("base64");

    res.json({
      image: image,
      size: { width, height },
    });
  } catch (e) {
    return res.status(500).json("error");
  }
});

app.listen(PORT, () => {
  console.log(`Server start on port: ${PORT}`);
});

function connectionHandler(ws: any, message: any) {
  ws.id = message.id;
  ws.username = message.username;
  broadcastConnection(ws, message);
}

function broadcastConnection(ws: any, message: any) {
  const connections: string[] = [];

  wss.clients.forEach((client: any) => {
    connections.push(client.username);
  });

  message.connections = connections;

  wss.clients.forEach((client: any) => {
    if (client.id === message.id) {
      client.send(JSON.stringify(message));
    }
  });
}
