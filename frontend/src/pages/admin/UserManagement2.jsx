import React from "react";
import "../styles/UserManagement.css";

const UserManagement = () => {
  const users = [
    { id: 1, name: "Desirae Philips", email: "desiarp@gmail.com", phone: "+62 812-9878-2081", status: "Checking Register", date: "24 June 2025" },
    { id: 2, name: "Gretchen Culhane", email: "gretchenc@gmail.com", phone: "+62 819-8750-0232", status: "Register Success", date: "24 June 2025" },
    { id: 3, name: "Lincoln Botosh", email: "lincolnb@gmail.com", phone: "+62 815-0612-4009", status: "Register Failed", date: "24 June 2025" },
    { id: 4, name: "Ahmad Franci", email: "ahmadfranci@gmail.com", phone: "+62 822-5325-6577", status: "Register Success", date: "24 June 2025" },
    { id: 5, name: "Maria Rosser", email: "mariarosser@gmail.com", phone: "+62 816-5526-9761", status: "Register Success", date: "24 June 2025" },
  ];

  return (
    <div className="user-management">
      <h2>User Management</h2>

      <div className="search-filter">
        <input type="text" placeholder="Search user by full name, email, username, or whatsapp number.." />
        <select>
          <option>Status</option>
          <option>Register Success</option>
          <option>Register Failed</option>
          <option>Checking Register</option>
        </select>
        <select>
          <option>Month</option>
          <option>June</option>
          <option>July</option>
        </select>
      </div>

      <table>
        <thead>
          <tr>
            <th>No.</th>
            <th>Full Name</th>
            <th>Email</th>
            <th>WhatsApp Number</th>
            <th>Status</th>
            <th>Register Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, i) => (
            <tr key={u.id}>
              <td>{i + 1}</td>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.phone}</td>
              <td>
                <span className={`status ${u.status.replace(" ", "-").toLowerCase()}`}>
                  {u.status}
                </span>
              </td>
              <td>{u.date}</td>
              <td className="actions">
                <button className="view">👁️</button>
                <button className="edit">✏️</button>
                <button className="delete">❌</button>
                <button className="approve">✔️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button>{"<"}</button>
        <button className="active">1</button>
        <button>2</button>
        <button>3</button>
        <span>...</span>
        <button>59</button>
        <button>{">"}</button>
      </div>
    </div>
  );
};

export default UserManagement;
