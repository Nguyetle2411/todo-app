const url = "https://6237243ff5f6e28a1549e266.mockapi.io/api/todoList";

const noResults = `
  <div class="no-results">
    <img src="public/img/no-results.gif" alt="no-results"/>
    <div class="no-results-msg">No results found. Add new or select another filter.</div>
  </div>
`;

let todoList = [];

let filter = "all";
let sort = "createdDate";
let sortType = "asc";

function getElmById(id) {
  return document.getElementById(id);
}

function setLoading(loading) {
  const loadingElm = getElmById("loading");

  loading ? loadingElm.classList.remove("hide") : loadingElm.classList.add("hide");
}

function checkDue(date) {
  return date < new Date().toISOString().slice(0, 10);
}

function getTodoListToRender(data) {
  let list = filter === "all" ? data : data.filter((el) => el.status === filter);

  list = list.sort((a, b) => {
    if (a[sort] === b[sort]) {
      return 0;
    }

    const flag = sortType === "asc" ? 1 : -1;

    return a[sort] > b[sort] ? flag : -flag;
  });

  return list;
}

function findItem(id) {
  return todoList.find((el) => el.id == id);
}

function getAddEditModalInputs() {
  const descriptionInput = getElmById("descriptionInput");
  const dueDateInput = getElmById("dueDateInput");

  return {
    descriptionInput,
    dueDateInput,
  };
}

function renderTodoList(list) {
  const todoListElm = getElmById("todo-list");

  if (!list?.length) {
    todoListElm.innerHTML = noResults;

    return;
  }

  const todoItems = list
    .map(function (el) {
      const isShowReminder = !checkDue(el.dueDate);

      return `
        <div class="todo-item ${el.status}">
            <div class="todo-item__left" onclick="toggleStatus(${el.id})">
              <input disabled class="form-check-input me-3 mt-0" type="checkbox" ${el.status === "completed" ? "checked" : ""} id="${el.id}">
              <label class="form-check-label" for="${el.id}">
                ${el.description}
              </label>
            </div>
            <div class="todo-item__right">
              ${
                isShowReminder
                  ? `<div class="todo-item__due-date-reminder">
                  <i class="fa fa-hourglass-start" aria-hidden="true"></i>
                  ${el.dueDate}</div>`
                  : ""
              }
              <div class="todo-item__btns">
                <i class="edit-btn fa fa-pencil" aria-hidden="true" data-bs-toggle="modal" data-bs-target="#addEditModal" onclick=handleClickEditItem(${el.id})></i>
                <i class="delete-btn fa fa-trash-o" aria-hidden="true" onclick=handleClickDeleteItem(${el.id})></i>
              </div>
            </div>
          </div>
        `;
    })
    .join("");

  todoListElm.innerHTML = todoItems;
}

async function getTodoList() {
  setLoading(true);

  const data = await fetch(url)
    .then((response) => response.json())
    .then((data) =>
      data.map((el) => {
        const due = el.dueDate && checkDue(el.dueDate);

        if (due && el.status === "active") {
          el.status = "hasDueDate";
        }

        return el;
      })
    )
    .finally(() => {
      setLoading(false);
    });

  todoList = data;
  renderTodoList(getTodoListToRender(data));
}

function addTodo(data) {
  setLoading(true);

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then(() => {
      getTodoList();
    })
    .finally(() => {
      setLoading(false);
    });
}

function updateTodo(id, data) {
  setLoading(true);

  fetch(`${url}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then(() => {
      getTodoList();
    })
    .finally(() => {
      setLoading(false);
    });
}

function toggleStatus(id) {
  setLoading(true);

  const selectedItem = findItem(id);

  if (selectedItem.status === "active" || selectedItem.status === "hasDueDate") {
    selectedItem.status = "completed";
  } else {
    const isDue = checkDue(selectedItem.dueDate);

    selectedItem.status = isDue ? "hasDueDate" : "active";
  }

  fetch(`${url}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(selectedItem),
  }).then(() => {
    getTodoList();
  });
}

function handleClickDeleteItem(id) {
  setLoading(true);

  fetch(`${url}/${id}`, {
    method: "DELETE",
  }).then(() => {
    getTodoList();
  });
}

function handleClickSubmit(id) {
  setLoading(true);

  const isEdit = !!id;
  const { descriptionInput, dueDateInput } = getAddEditModalInputs();
  const selectedItem = findItem(id);
  const { createdDate, status } = selectedItem || {};

  const data = {
    description: descriptionInput.value,
    dueDate: dueDateInput.value,
    status: isEdit ? status : "active",
    createdDate: isEdit ? createdDate : new Date().toISOString().slice(0, 10),
  };
  const form = getElmById("todo-form");

  form.classList.add("was-validated");

  if (form.checkValidity()) {
    const addEditModal = bootstrap.Modal.getInstance(document.getElementById("addEditModal"));

    isEdit ? updateTodo(id, data) : addTodo(data);
    addEditModal.hide();
  }
}

function handleClickEditItem(id) {
  const addEditModalLabel = getElmById("addEditModalLabel");
  const selectedItem = findItem(id);
  const todoForm = getElmById("todo-form");
  const submitBtn = getElmById("submit-btn");
  const { description, dueDate, createdDate } = selectedItem;

  addEditModalLabel.innerHTML = "Edit Todo";
  submitBtn.innerHTML = "Save changes";
  submitBtn.onclick = () => handleClickSubmit(id);
  todoForm.innerHTML = `
    <div>
      <label for="description" class="form-label">Description</label>
      <input value="${description}" type="text" class="form-control" id="descriptionInput" placeholder="Enter description" required>
      <div class="invalid-feedback">
        Please enter description.
      </div>
    </div>
    <div class="mt-3">
      <label for="dueDate" class="form-label">Select due date</label>
      <input value="${dueDate}" type="date" class="form-control" id="dueDateInput">
      <div class="invalid-feedback">
        Please select due date.
      </div>
    </div>
    <div class="mt-3">
      <label for="createdDate" class="form-label">Created date</label>
      <input disabled value="${createdDate}" type="date" class="form-control" id="createdDateInput">
    </div>
  `;
}

function handleClickAddBtn() {
  const addEditModalLabel = getElmById("addEditModalLabel");
  const todoForm = getElmById("todo-form");
  const submitBtn = getElmById("submit-btn");

  addEditModalLabel.innerHTML = "Add Todo";
  submitBtn.innerHTML = "Add";
  submitBtn.onclick = () => handleClickSubmit()
  todoForm.innerHTML = `
    <div>
      <label for="description" class="form-label">Description</label>
      <input type="text" class="form-control" id="descriptionInput" placeholder="Enter description" required>
      <div class="invalid-feedback">
        Please enter description.
      </div>
    </div>
    <div class="mt-3">
      <label for="dueDate" class="form-label">Select due date</label>
      <input type="date" class="form-control" id="dueDateInput">
      <div class="invalid-feedback">
        Please select due date.
      </div>
    </div>
  `;
}

function handleClickAsc() {
  const ascIcon = getElmById("sort-type--asc");
  const descIcon = getElmById("sort-type--desc");

  sortType = "desc";
  renderTodoList(getTodoListToRender(todoList));
  ascIcon.classList.add("hide");
  descIcon.classList.remove("hide");
}

function handleClickDesc() {
  const descIcon = getElmById("sort-type--desc");
  const ascIcon = getElmById("sort-type--asc");

  sortType = "asc";
  renderTodoList(getTodoListToRender(todoList));
  descIcon.classList.add("hide");
  ascIcon.classList.remove("hide");
}

function init() {
  /* Add filter event */
  const filterSelect = getElmById("filter");
  filterSelect.addEventListener("change", function (e) {
    filter = e.target.value;
    renderTodoList(getTodoListToRender(todoList));
  });

  /* Add sort event */
  const sortSelect = getElmById("sort");
  sortSelect.addEventListener("change", function (e) {
    sort = e.target.value;
    renderTodoList(getTodoListToRender(todoList));
  });

  /* Handle modal close */
  const addEditModal = document.getElementById("addEditModal");
  addEditModal.addEventListener("hidden.bs.modal", function () {
    const form = getElmById("todo-form");
    form.classList.remove("was-validated");
  });
}

init();
getTodoList();
