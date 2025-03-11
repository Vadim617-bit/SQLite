const request = require("supertest");
const app = require("../index");

// variable declaration (оголошення змінних)
describe("User API Tests", () => {
  let userId;
  let friendId;

  // creation (створення)
  it("POST /users - should create a new user", async () => {
    const res = await request(app)
      .post("/users")
      .send({ name: "John Doe", age: 30 })
      .expect(201);

    userId = res.body.id;
    expect(res.body).toHaveProperty("name", "John Doe");
    expect(res.body).toHaveProperty("age", 30);
  });

  // list retrieval (отримання списку)
  it("GET /users - should return users list", async () => {
    const res = await request(app).get("/users").expect(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  // Receiving for the IDs (отримання за айди)
  it("GET /users/:id - should return user by ID", async () => {
    const res = await request(app).get(`/users/${userId}`).expect(200);
    expect(res.body).toHaveProperty("id", userId);
  });

  // data update (оновлення даних)
  it("PUT /users/:id - should update user", async () => {
    const res = await request(app)
      .put(`/users/${userId}`)
      .send({ name: "Jane Doe", age: 25 })
      .expect(200);

    expect(res.body).toHaveProperty("name", "Jane Doe");
    expect(res.body).toHaveProperty("age", 25);
  });

  // creation of 2 users (створення 2 користувача)
  it("POST /users - should create a second user", async () => {
    const res = await request(app)
      .post("/users")
      .send({ name: "Alice", age: 28 })
      .expect(201);

    friendId = res.body.id;
  });

  // adding a friend (додавання друга)
  it("POST /users/:id/friends - should add a friend", async () => {
    const res = await request(app)
      .post(`/users/${userId}/friends`)
      .send({ friendId })
      .expect(201);

    expect(res.body).toHaveProperty("message", "Friend added successfully");
  });

  // getting a list of friends (отримання списку друзів)
  it("GET /users/:id/friends - should return friends list", async () => {
    const res = await request(app).get(`/users/${userId}/friends`).expect(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0]).toHaveProperty("id", friendId);
  });

  // friend deletion (видалення друга)
  it("DELETE /users/:id/friends/:friendId - should remove a friend", async () => {
    const res = await request(app)
      .delete(`/users/${userId}/friends/${friendId}`)
      .expect(200);

    expect(res.body).toHaveProperty("message", "Friend removed successfully");
  });

  // user deletion (видалення користувача)
  it("DELETE /users/:id - should delete user", async () => {
    await request(app).delete(`/users/${userId}`).expect(204);
  });
});
