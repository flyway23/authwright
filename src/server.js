import app from "./app.js";

app.listen(process.env.PORT || 3000, () => {
  console.log(process.env.PORT);
  console.log(`running on http://localhost:${process.env.PORT}`);
});
