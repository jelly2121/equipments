let equipmentData = [];

async function loadEquipment() {
  const { data, error } = await supabaseClient
    .from("equipment")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error(error);
    alert("Unable to load equipment: " + error.message);
    return;
  }

  equipmentData = data || [];
  displayEquipment(equipmentData);
}

function displayEquipment(data) {
  const tbody = document.getElementById("equipmentTableBody");
  tbody.innerHTML = "";

  data.forEach(item => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${item.id}</td>
      <td>${escapeHtml(item.equipment_name)}</td>
      <td>${escapeHtml(item.category)}</td>
      <td>${escapeHtml(item.asset_code)}</td>
      <td>${escapeHtml(item.condition)}</td>
      <td><span class="status ${item.availability.toLowerCase()}">${item.availability}</span></td>
      <td>
        <button class="btn-secondary" onclick="editEquipment(${item.id})">Edit</button>
        <button class="btn-danger" onclick="deleteEquipment(${item.id})">Delete</button>
      </td>
    `;

    tbody.appendChild(row);
  });
}

function showAddEquipmentForm() {
  document.getElementById("equipmentFormContainer").innerHTML = `
    <div class="form-container">
      <h3>Add Equipment</h3>
      <form onsubmit="addEquipment(event)">
        <div class="form-grid">
          <div class="form-group">
            <label>Equipment Name</label>
            <input id="equipmentName" required>
          </div>
          <div class="form-group">
            <label>Category</label>
            <input id="equipmentCategory" required>
          </div>
          <div class="form-group">
            <label>Asset Code</label>
            <input id="assetCode" required>
          </div>
          <div class="form-group">
            <label>Condition</label>
            <select id="equipmentCondition">
              <option>Good</option>
              <option>Fair</option>
              <option>For Repair</option>
            </select>
          </div>
        </div>
        <button class="btn-primary">Save Equipment</button>
        <button type="button" class="btn-secondary" onclick="closeEquipmentForm()">Cancel</button>
      </form>
    </div>
  `;
}

async function addEquipment(event) {
  event.preventDefault();

  const equipment = {
    equipment_name: document.getElementById("equipmentName").value.trim(),
    category: document.getElementById("equipmentCategory").value.trim(),
    asset_code: document.getElementById("assetCode").value.trim(),
    condition: document.getElementById("equipmentCondition").value,
    availability: "Available"
  };

  const { error } = await supabaseClient.from("equipment").insert([equipment]);

  if (error) {
    alert("Failed to add equipment: " + error.message);
    return;
  }

  closeEquipmentForm();
  await loadEquipment();
  await loadDashboard();
}

async function editEquipment(id) {
  const item = equipmentData.find(x => x.id === id);
  if (!item) return;

  const name = prompt("Equipment Name:", item.equipment_name);
  if (name === null) return;

  const category = prompt("Category:", item.category);
  if (category === null) return;

  const assetCode = prompt("Asset Code:", item.asset_code);
  if (assetCode === null) return;

  const condition = prompt("Condition (Good, Fair, For Repair):", item.condition);
  if (condition === null) return;

  const { error } = await supabaseClient
    .from("equipment")
    .update({
      equipment_name: name.trim(),
      category: category.trim(),
      asset_code: assetCode.trim(),
      condition: condition.trim()
    })
    .eq("id", id);

  if (error) {
    alert("Update failed: " + error.message);
    return;
  }

  await loadEquipment();
}

async function deleteEquipment(id) {
  const item = equipmentData.find(x => x.id === id);
  if (!item) return;

  if (item.availability !== "Available") {
    alert("Borrowed equipment cannot be deleted.");
    return;
  }

  if (!confirm(`Delete "${item.equipment_name}"?`)) return;

  const { error } = await supabaseClient
    .from("equipment")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Delete failed: " + error.message);
    return;
  }

  await loadEquipment();
  await loadDashboard();
}

function searchEquipment() {
  const search = document.getElementById("equipmentSearch").value.toLowerCase().trim();

  const filtered = equipmentData.filter(item =>
    item.equipment_name.toLowerCase().includes(search) ||
    item.asset_code.toLowerCase().includes(search) ||
    item.category.toLowerCase().includes(search)
  );

  displayEquipment(filtered);
}

function closeEquipmentForm() {
  document.getElementById("equipmentFormContainer").innerHTML = "";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
