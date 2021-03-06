const express = require('express');
const { rejectUnauthenticated } = require('../modules/authentication-middleware');
const { query } = require('../modules/pool');
const pool = require('../modules/pool');
const router = express.Router();


//UPDATE ROUTE TO PROMOTE AUTH LEVEL
router.put('/promote', rejectUnauthenticated, (req, res) => {

  const queryText = `
    UPDATE "user"
    SET "auth_level" = $2
    WHERE "user".id = $1;`

    if (req.user.auth_level >= 10 && req.body.value <= 10) {
  pool.query(queryText, [req.body.id, req.body.value])
    .then(result => { res.sendStatus(200) })
    .catch(err => {
      console.log('error with activate user route', err);
      res.sendStatus(500);
    })
  } else if (req.user.auth_level >= 20 && req.body.value <= 20) {
    pool.query(queryText, [req.body.id, req.body.value])
    .then(result => { res.sendStatus(200) })
    .catch(err => {
      console.log('error with activate user route', err);
      res.sendStatus(500);
    })
  } else {
    res.sendStatus(403);
  }
});

//UPDATE ROUTE TO ACTIVATE A MEMBER
router.put('/activate', rejectUnauthenticated, (req, res) => {

  const queryText = `
    UPDATE "user"
    SET "auth_level" = 5
    WHERE "user".id = $1;`

  if (req.user.auth_level >= 10) {
    pool.query(queryText, [req.body.id])
      .then(result => { res.sendStatus(200) })
      .catch(err => {
        console.log('error with activate user route', err);
        res.sendStatus(500);
      })
  } else {
    res.sendStatus(403);
  }
});

//UPDATE ROUTE TO DEACTIVATE A MEMBER
router.put('/deactivate', rejectUnauthenticated, (req, res) => {

  const queryText = `
    UPDATE "user"
    SET "auth_level" = 0
    WHERE "user".id = $1;`

  if (req.user.auth_level >= 10) {
    pool.query(queryText, [req.body.id])
      .then(result => { res.sendStatus(200) })
      .catch(err => {
        console.log('error with activate user route', err);
        res.sendStatus(500);
      })
  } else {
    res.sendStatus(403);
  }
});

// GET ALL ACTIVE MEMBERS
router.get('/active/:id', rejectUnauthenticated, async (req, res) => {


  const dojoAdminQueryText = `
    SELECT "user_data".dojo_id FROM "user_data"
    WHERE "user_data".user_id = $1 LIMIT 1;`

  const queryText = `
    SELECT "user_data".*, "user".id, "user".username, "user".auth_level, "dojo".dojo_name FROM "user"
    JOIN "user_data" ON "user".id = "user_data".user_id
    JOIN "dojo" ON "user_data".dojo_id = "dojo".id
    WHERE "user".auth_level > 0 AND "user_data".dojo_id = $1 AND $2 = $1;
    `;

  if (req.user.auth_level === 10) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      //first query to get the admin dojo_id if they are auth_level 10
      let adminDojoId = await client.query(dojoAdminQueryText, [req.user.id])
      adminDojoId = adminDojoId.rows[0].dojo_id

      response = await client.query(queryText, [req.params.id, adminDojoId]);

      await client.query('COMMIT');

      res.send(response.rows)

    } catch (error) {
      console.log('Error in GET active members auth_lvl 10 access', error);
      await client.query('ROLLBACK');
      res.sendStatus(500);

    } finally {
      await client.release();

    }
  } else if (req.user.auth_level >= 20) {

    const siteAdminQueryText = `
    SELECT "user_data".*, "user".id, "user".username, "user".auth_level, "dojo".dojo_name FROM "user"
    JOIN "user_data" ON "user".id = "user_data".user_id
    JOIN "dojo" ON "user_data".dojo_id = "dojo".id
    WHERE "user".auth_level > 0 AND "user_data".dojo_id = $1;
    `

    pool.query(siteAdminQueryText, [req.params.id])
      .then(result => {
        res.send(result.rows)

      })

      .catch(error => {
        console.log('error in /api/members/active get:', error);
        res.sendStatus(500);
      })
    } else {
      res.sendStatus(403);
    }
});

// GET ALL INACTIVE MEMBERS
router.get('/inactive/:id', rejectUnauthenticated, async (req, res) => {

  const dojoAdminQueryText = `
    SELECT "user_data".dojo_id FROM "user_data"
    WHERE "user_data".user_id = $1 LIMIT 1;`

  const queryText = `
    SELECT "user_data".*, "user".id, "user".username, "user".auth_level FROM "user"
    JOIN "user_data" ON "user".id = "user_data".user_id
    JOIN "dojo" ON "user_data".dojo_id = "dojo".id
    WHERE "user".auth_level = 0 AND "user_data".dojo_id = $1 AND $2 = $1;
    `

  if (req.user.auth_level === 10) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      //first query to get the admin dojo_id if they are auth_level 10
      let adminDojoId = await client.query(dojoAdminQueryText, [req.user.id])
      adminDojoId = adminDojoId.rows[0].dojo_id

      response = await client.query(queryText, [req.params.id, adminDojoId]);

      await client.query('COMMIT');

      res.send(response.rows)

    } catch (error) {
      console.log('Error in GET inactive members auth_lvl 10 access', error);
      await client.query('ROLLBACK');
      res.sendStatus(500);

    } finally {
      await client.release();

    }
  } else if (req.user.auth_level >= 20) {

    const siteAdminQueryText = `
      SELECT "user_data".*, "user".id, "user".username, "user".auth_level FROM "user"
      JOIN "user_data" ON "user".id = "user_data".user_id
      JOIN "dojo" ON "user_data".dojo_id = "dojo".id
      WHERE "user".auth_level = 0 AND "user_data".dojo_id = $1;
      `

    pool.query(siteAdminQueryText, [req.params.id])
      .then(result => {
        res.send(result.rows)
      })
      .catch(error => {
        console.log('Error in GET inactive members auth_level 20 access', error);
        res.sendStatus(500)
      })
  } else {
    res.sendStatus(403);
  }
});

// GET *ONLY* NAMES AND RANKS (FOR MY DOJO)
router.get('/mydojo', rejectUnauthenticated, async (req, res) => {


  if (req.user.auth_level >= 5) {


    const client = await pool.connect();

    try {

      const firstQuery = `

    SELECT "user_data".dojo_id FROM "user_data"
    WHERE "user_data".user_id = $1 LIMIT 1;
    `;

      const secondQuery = `
    SELECT "user_data".fname, "user_data".lname,
    "user_data".fname_japanese, "user_data".lname_japanese, 
    "user_data".student_rank, "user_data".teaching_rank 
    FROM "user_data"
    WHERE "user_data".dojo_id = $1
    ORDER BY "user_data".id ASC;
    `;

      await client.query('BEGIN');

      userDojoId = await client.query(firstQuery, [req.user.id]);

      userDojoId = userDojoId.rows[0].dojo_id;

      response = await client.query(secondQuery, [userDojoId]);

      await client.query('COMMIT');

      // set our response deals to send back
      res.send(response.rows)

      // res.sendStatus(200);
    } catch (error) {
      console.log('error in mydojo get', error);

      await client.query('ROLLBACK');
      res.sendStatus(500);

    } finally {
      await client.release();

    }
  } else {
    res.sendStatus(403)

  }
})

router.get(`/search/:term`, rejectUnauthenticated, (req, res) => {

  if (req.user.auth_level >= 5) {
  queryText = `
  SELECT "user_data".*, "user".* FROM "user_data" 
  JOIN "user" ON "user_data".user_id = "user".id
  WHERE "user_data".fname ILIKE '%' || $1 || '%';
  `;
  // LIMIT ?
  pool
    .query(queryText, [req.params.term])
    .then( (result) => {
      res.send(result.rows);
    })
    .catch(
      (error) => {
        console.log('Error in search', error);
        res.sendStatus(500);
      })
  } else {
    res.sendStatus(403)
  }
})


/**
 * POST route template
 */
router.post('/', (req, res) => {
  // POST route code here
});

// DELETEs all data associated with a user 
router.delete('/:id', rejectUnauthenticated, (req, res) => {

  let queryText = `
      DELETE FROM "user"
      WHERE "id" = $1;
      `
  if (req.user.auth_level >= 5) {

  pool.query(queryText, [req.params.id])
      .then( (result) => {
      res.sendStatus(200);
  })
  .catch( (error) => {
      console.log('Error in delete', error);
      res.sendStatus(500);
  })
} else {
  res.sendStatus(403)
}
});

module.exports = router;
