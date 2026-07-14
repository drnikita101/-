const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTask");
const taskList = document.getElementById("taskList");
const taskCount = document.getElementById("taskCount");
const clearCompletedBtn = document.getElementById("clearCompleted");


let tasks = JSON.parse(
    localStorage.getItem("tasks")
) || [];



function saveTasks() {

    localStorage.setItem(
        "tasks",
        JSON.stringify(tasks)
    );

}



function updateCount() {

    const activeTasks = tasks.filter(
        task => !task.completed
    ).length;


    taskCount.textContent =
        `Активных задач: ${activeTasks}`;

}



function renderTasks() {

    taskList.innerHTML = "";


    if(tasks.length === 0){

        taskList.innerHTML =
        `<li class="empty">
            Нет задач
        </li>`;

        updateCount();
        return;

    }



    tasks.forEach(task => {


        const li = document.createElement("li");

        li.className =
            "task";


        if(task.completed){

            li.classList.add("completed");

        }



        li.innerHTML = `

            <input 
                type="checkbox"
                class="checkbox"
                ${task.completed ? "checked" : ""}
            >

            <span>
                ${task.text}
            </span>

            <button class="delete">
                Удалить
            </button>

        `;



        const checkbox =
            li.querySelector(".checkbox");


        checkbox.addEventListener(
            "change",
            () => {

                task.completed =
                    checkbox.checked;

                saveTasks();

                renderTasks();

            }
        );



        li.querySelector(".delete")
        .addEventListener(
            "click",
            () => {

                tasks =
                    tasks.filter(
                        t => t.id !== task.id
                    );


                saveTasks();

                renderTasks();

            }
        );



        taskList.appendChild(li);


    });


    updateCount();

}




function addTask(){

    const text =
        taskInput.value.trim();



    if(text === "") return;



    tasks.push({

        id: Date.now(),

        text,

        completed:false

    });



    taskInput.value = "";


    saveTasks();

    renderTasks();

}



addTaskBtn.addEventListener(
    "click",
    addTask
);



taskInput.addEventListener(
    "keydown",
    e => {

        if(e.key === "Enter"){

            addTask();

        }

    }
);



clearCompletedBtn.addEventListener(
    "click",
    () => {


        tasks =
            tasks.filter(
                task => !task.completed
            );


        saveTasks();

        renderTasks();


    }
);



renderTasks();