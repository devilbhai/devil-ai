fetch("http://127.0.0.1:1420/api/sessions")
  .then(res => res.json())
  .then(data => console.log(JSON.stringify(data[0], null, 2)))
  .catch(console.error);
