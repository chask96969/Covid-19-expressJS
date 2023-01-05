const express = require("express");
const path = require("path");
const app = express();
module.exports = app;
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;
app.use(express.json());
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convert = (val) => {
  return {
    stateId: val.state_id,
    stateName: val.state_name,
    population: val.population,
  };
};

const concert2 = (val) => {
  return {
    districtId: val.district_id,
    districtName: val.district_name,
    stateId: val.state_id,
    cases: val.cases,
    cured: val.cured,
    active: val.active,
    deaths: val.deaths,
  };
};

const last = (v) => {
  return {
    stateName: v.state_name,
  };
};
app.get("/states/", async (request, response) => {
  const q = "select * from state";
  const res = await db.all(q);
  response.send(res.map((each) => convert(each)));
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const q = `select * from state where state_id=${stateId};`;
  const res = await db.get(q);
  response.send(convert(res));
});

app.post("/districts/", async (request, response) => {
  const detail = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = detail;
  console.log(detail);
  const q = `insert into district (district_name,state_id,cases,cured,active,deaths) values
                ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const res = await db.run(q);
  const districtId = res.lastID;
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const q = `select * from district where district_id=${districtId}`;
  const res = await db.get(q);
  response.send(concert2(res));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const q = `delete from district where district_id=${districtId};`;
  const res = await db.run(q);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const q = `update district set district_name='${districtName}',state_id=${stateId},cases=${cases},cured=${cured},active=${active},deaths=${deaths} where district_id=${districtId};`;
  const res = await db.run(q);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const q = `select sum(cases) as totalCases,sum(cured) as totalCured,sum(active) as totalActive,sum(deaths) as totalDeaths from district where state_id=${stateId} group by state_id;`;
  const re = await db.get(q);
  response.send(re);
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const q = `select state_name from state natural JOIN district where district_id=${districtId};`;
  const re = await db.get(q);
  response.send(last(re));
});
