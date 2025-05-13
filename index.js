function createElement(tag, attributes, children, callbacks) {
  const element = document.createElement(tag);

  if (attributes) {
    Object.keys(attributes).forEach((key) => {
      element.setAttribute(key, attributes[key]);
    });
  }

  if (Array.isArray(children)) {
    children.forEach((child) => {
      if (typeof child === "string") {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof HTMLElement) {
        element.appendChild(child);
      }
    });
  } else if (typeof children === "string") {
    element.appendChild(document.createTextNode(children));
  } else if (children instanceof HTMLElement) {
    element.appendChild(children);
  }

  if (Array.isArray(callbacks)) {
    callbacks.forEach(({ event, callback }) => {
      element.addEventListener(event, callback);
    });
  }

  return element;
}

class Component {
  constructor() {
  }

  getDomNode() {
    this._domNode = this.render();
    return this._domNode;
  }
  
  update() {
    const newDomNode = this.render();
    if (this._domNode && this._domNode.parentNode) {
      this._domNode.parentNode.replaceChild(newDomNode, this._domNode);
    }
    this._domNode = newDomNode;
  }
}

class Task extends Component {
  constructor(doneFlag, text, onDelete, saver) {
    super();
    this.props = { doneFlag: doneFlag, text:  text, onDelete: onDelete };
    this.state = { deleteClicked: false };
    this.onDeleteButtonClick = this.onDeleteButtonClick.bind(this);
    this.onCheckboxPick = this.onCheckboxPick.bind(this);
    this.saver = saver;
  }

  onDeleteButtonClick() {
    if (!this.state.deleteClicked) {
      this.state.deleteClicked = true;
      this.update();
    } else {
      this.props.onDelete();
    }
  }
  
  render() {
    console.log(this.props.doneFlag);
    const checkboxAttributes = {
      type: "checkbox",
    }
    if (this.props.doneFlag){
      checkboxAttributes.checked = true
    }
    return createElement("li", {}, [
      createElement("input", checkboxAttributes, [{}], [{ event: "change", callback: this.onCheckboxPick }]),
      createElement("label", {}, this.props.text),
      createElement(
        "button",
        this.state.deleteClicked ? { style: "background-color: red" } : {},
        "🗑️",
        [{ event: "click", callback: this.onDeleteButtonClick }]
      )
    ]);
  }

  onCheckboxPick(){
    this.props.doneFlag = !this.props.doneFlag;
    console.log(this.props.doneFlag);
    this.saver();
  }
}

class TodoList extends Component {
  constructor() {
    super();
    const saved = localStorage.getItem("todoList");
    this.saveState = this.saveState.bind(this);
    if (saved) {
      const { tasks, inputValue } = JSON.parse(saved);
      this.state = {
        tasks: tasks.map((t, index) => {
          const task = new Task(t.doneFlag, t.text, () => this.onDeleteTask(index), this.saveState);
          task.state.deleteClicked = t.deleteClicked;
          return task;
        }),
        inputValue
      };
    } else {
      this.state = {
        tasks: [
          new Task(false, "Сделать домашку", () => this.onDeleteTask(0), this.saveState),
          new Task(false, "Сделать практику", () => this.onDeleteTask(1), this.saveState),
          new Task(false, "Пойти домой", () => this.onDeleteTask(2), this.saveState)
        ],
        inputValue: ""
      };
    }
    this.onAddTask = this.onAddTask.bind(this);
    this.onAddInputChange = this.onAddInputChange.bind(this);
    this.onDeleteTask = this.onDeleteTask.bind(this);
  }

  saveState() {
    const tasksState = this.state.tasks.map(task => ({
      doneFlag: task.props.doneFlag,
      text: task.props.text,
      deleteClicked: task.state.deleteClicked
    }));
    localStorage.setItem(
      "todoList",
      JSON.stringify({ tasks: tasksState, inputValue: this.state.inputValue })
    );
  }

  onAddInputChange(e) {
    this.state.inputValue = e.target.value;
    this.saveState();
  }

  onAddTask() {
    if (this.state.inputValue.trim()) {
      this.state.tasks.push(
        new Task(false, this.state.inputValue, () => this.onDeleteTask(this.state.tasks.length), this.saveState)
      );
      this.state.inputValue = "";
      this.update();
    }
  }

  onDeleteTask(index) {
    this.state.tasks.splice(index, 1);
    this.update();
  }

  update() {
    super.update();
    this.saveState();
  }
render() {
    return createElement("div", { class: "todo-list" }, [
      createElement("h1", {}, "TODO List"),
      createElement("div", { class: "add-todo" }, [
        createElement("input", {
          id: "new-todo",
          type: "text",
          placeholder: "Задание",
          value: this.state.inputValue
        }, null, [
          { event: "input", callback: this.onAddInputChange }
        ]),
        createElement("button", { id: "add-btn" }, "+", [
          { event: "click", callback: this.onAddTask }
        ])
      ]),
      createElement(
        "ul",
        { id: "todos" },
        this.state.tasks.map((task, index) => {
          task.props.onDelete = () => this.onDeleteTask(index);
          return task.getDomNode();
        })
      )
    ]);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.body.appendChild(new TodoList().getDomNode());
});
