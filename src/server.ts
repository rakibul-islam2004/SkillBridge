import app from "./app";

const PORT = process.env.PORT || 4000;

function server() {
  app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
  });
}

server();
