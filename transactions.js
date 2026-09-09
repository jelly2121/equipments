let transactionData = [];

async function loadTransactions() {
  const { data, error } = await supabaseClient
    .from("borrow_transactions")
    .select("*, equipment(equipment_name, asset_code)")
    .order("id", { ascending: false });

  if (error) {
    console.error(error);
    alert("Unable to load transactions: " + error.message);
    return;
  }

  transactionData = data || [];
  await updateOverdueStatuses();
  displayTransactions(transactionData);
}

async function updateOverdueStatuses() {
  const today = new Date().toISOString().split("T")[0];

  const overdue = transactionData.filter(t =>
    t.status !== "Returned" &&
    t.due_date < today
  );

  for (const transaction of overdue) {
    await supabaseClient
      .from("borrow_transactions")
      .update({ status: "Overdue" })
      .eq("id", transaction.id);

    transaction.status = "Overdue";
  }
}

function showBorrowForm() {
  const available = equipmentData.filter(e => e.availability === "Available");

  if (available.length === 0) {
    alert("No equipment is currently available.");
    return;
  }

  const options = available.map(e =>
    `<option value="${e.id}">${escapeHtml(e.equipment_name)} (${escapeHtml(e.asset_code)})</option>`
  ).join("");

  document.getElementById("borrowFormContainer").innerHTML = `
    <div class="form-container">
      <h3>New Borrowing Transaction</h3>
      <form onsubmit="borrowEquipment(event)">
        <div class="form-grid">
          <div class="form-group">
            <label>Borrower Name</label>
            <input id="borrowerName" required>
          </div>

          <div class="form-group">
            <label>Borrower Type</label>
            <select id="borrowerType">
              <option>Student</option>
              <option>Faculty</option>
              <option>Staff</option>
            </select>
          </div>

          <div class="form-group">
            <label>Department</label>
            <input id="department" required>
          </div>

          <div class="form-group">
            <label>Equipment</label>
            <select id="borrowEquipmentId">${options}</select>
          </div>

          <div class="form-group">
            <label>Date Borrowed</label>
            <input type="date" id="dateBorrowed" value="${today()}" required>
          </div>

          <div class="form-group">
            <label>Due Date</label>
            <input type="date" id="dueDate" required>
          </div>
        </div>

        <button class="btn-primary">Save Borrowing Transaction</button>
        <button type="button" class="btn-secondary" onclick="closeBorrowForm()">Cancel</button>
      </form>
    </div>
  `;
}

async function borrowEquipment(event) {
  event.preventDefault();

  const borrowerName = document.getElementById("borrowerName").value.trim();
  const borrowerType = document.getElementById("borrowerType").value;
  const department = document.getElementById("department").value.trim();
  const equipmentId = Number(document.getElementById("borrowEquipmentId").value);
  const dateBorrowed = document.getElementById("dateBorrowed").value;
  const dueDate = document.getElementById("dueDate").value;

  if (!borrowerName || !department) {
    alert("Borrower name and department are required.");
    return;
  }

  if (dueDate < dateBorrowed) {
    alert("Due date cannot be earlier than borrowing date.");
    return;
  }

  const equipment = equipmentData.find(e => e.id === equipmentId);

  if (!equipment || equipment.availability !== "Available") {
    alert("Only available equipment may be borrowed.");
    return;
  }

  const { data: { user } } = await supabaseClient.auth.getUser();

  const { error: transactionError } = await supabaseClient
    .from("borrow_transactions")
    .insert([{
      equipment_id: equipmentId,
      borrower_name: borrowerName,
      borrower_type: borrowerType,
      department: department,
      date_borrowed: dateBorrowed,
      due_date: dueDate,
      status: "Borrowed",
      user_id: user ? user.id : null
    }]);

  if (transactionError) {
    alert("Borrowing failed: " + transactionError.message);
    return;
  }

  const { error: equipmentError } = await supabaseClient
    .from("equipment")
    .update({ availability: "Borrowed" })
    .eq("id", equipmentId);

  if (equipmentError) {
    alert("Transaction saved, but equipment status update failed: " + equipmentError.message);
    return;
  }

  closeBorrowForm();
  await loadEquipment();
  await loadTransactions();
  await loadDashboard();
}

async function returnEquipment(id) {
  const transaction = transactionData.find(t => t.id === id);

  if (!transaction) return;

  if (transaction.status === "Returned") {
    alert("This transaction has already been returned.");
    return;
  }

  if (!confirm("Return this equipment?")) return;

  const returnDate = today();

  const { error: transactionError } = await supabaseClient
    .from("borrow_transactions")
    .update({
      date_returned: returnDate,
      status: "Returned"
    })
    .eq("id", id);

  if (transactionError) {
    alert("Return failed: " + transactionError.message);
    return;
  }

  const { error: equipmentError } = await supabaseClient
    .from("equipment")
    .update({ availability: "Available" })
    .eq("id", transaction.equipment_id);

  if (equipmentError) {
    alert("Return recorded, but equipment status update failed: " + equipmentError.message);
    return;
  }

  await loadEquipment();
  await loadTransactions();
  await loadDashboard();
}

function displayTransactions(data) {
  const tbody = document.getElementById("transactionTableBody");
  tbody.innerHTML = "";

  data.forEach(t => {
    const row = document.createElement("tr");

    const equipmentName = t.equipment?.equipment_name || "Unknown";

    row.innerHTML = `
      <td>${t.id}</td>
      <td>${escapeHtml(equipmentName)}</td>
      <td>${escapeHtml(t.borrower_name)}</td>
      <td>${escapeHtml(t.borrower_type)}</td>
      <td>${escapeHtml(t.department)}</td>
      <td>${t.date_borrowed}</td>
      <td>${t.due_date}</td>
      <td><span class="status ${t.status.toLowerCase()}">${t.status}</span></td>
      <td>
        ${t.status !== "Returned"
          ? `<button class="btn-warning" onclick="returnEquipment(${t.id})">Return</button>`
          : "Completed"}
      </td>
    `;

    tbody.appendChild(row);
  });
}

function searchTransactions() {
  const search = document.getElementById("transactionSearch").value.toLowerCase().trim();

  const filtered = transactionData.filter(t =>
    t.borrower_name.toLowerCase().includes(search) ||
    (t.equipment?.equipment_name || "").toLowerCase().includes(search)
  );

  displayTransactions(filtered);
}

function filterTransactions() {
  const filter = document.getElementById("statusFilter").value;

  if (filter === "All") {
    displayTransactions(transactionData);
    return;
  }

  displayTransactions(
    transactionData.filter(t => t.status === filter)
  );
}

function closeBorrowForm() {
  document.getElementById("borrowFormContainer").innerHTML = "";
}

function today() {
  return new Date().toISOString().split("T")[0];
}

async function loadDashboard() {
  const { data: equipment, error: equipmentError } =
    await supabaseClient.from("equipment").select("*");

  if (equipmentError) {
    console.error(equipmentError);
    return;
  }

  const { data: transactions, error: transactionError } =
    await supabaseClient.from("borrow_transactions").select("*");

  if (transactionError) {
    console.error(transactionError);
    return;
  }

  const todayDate = today();

  const overdue = transactions.filter(t =>
    t.status !== "Returned" && t.due_date < todayDate
  );

  document.getElementById("totalEquipment").textContent =
    equipment.length;

  document.getElementById("availableEquipment").textContent =
    equipment.filter(e => e.availability === "Available").length;

  document.getElementById("borrowedEquipment").textContent =
    equipment.filter(e => e.availability === "Borrowed").length;

  document.getElementById("returnedTransactions").textContent =
    transactions.filter(t => t.status === "Returned").length;

  document.getElementById("overdueEquipment").textContent =
    overdue.length;
}
