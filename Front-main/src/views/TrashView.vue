<template>
  <div class="trash-container">
    <div class="trash-header">
      <h3>Tâches Supprimées</h3>
    </div>
    <div class="trash-content">
      <div v-if="trash.length">
        <TaskDisplayTrash
          v-for="task in trash"
          :key="task.id"
          :task="task"
          class="full-width-task"
          @update-task="updateTaskStatus"
          @delete-task="handleDeleteTask"
        />
      </div>
      <div v-else class="no-tasks">
        <p>Aucune tâche supprimée</p>
        <img
          :src="require('@/assets/NoTasksss.png')"
          alt="No Tasks"
          class="img-fluid animated-image"
        />
      </div>
    </div>
  </div>
</template>

<script>
import TaskDisplayTrash from "@/components/TaskDisplayTrash.vue";
import axios from "axios";

export default {
  name: "TrashView",
  components: { TaskDisplayTrash },
  data() {
    return {
      trash: [],
    };
  },
  mounted() {
    this.fetchDeletedTasks();
  },
  methods: {
    fetchDeletedTasks() {
      axios
        .get("http://localhost:3000/api/deleted")
        .then((response) => {
          this.trash = response.data;
        })
        .catch((error) => {
          console.error("Error fetching tasks:", error);
        });
    },

    updateTaskStatus(updatedTask) {
    const taskIndex = this.tasks.findIndex(task => task.id === updatedTask.id);
    if (taskIndex !== -1) {
      // Update the task's status locally
      this.tasks[taskIndex] = updatedTask;
    }
  },

  // Method to remove the task from the list
  removeTask(taskId) {
    // Remove the task with the given ID from the local tasks array
    this.tasks = this.tasks.filter(task => task.id !== taskId);
  },
    handleDeleteTask(taskId) {
      axios
        .delete(`http://localhost:3000/api/tasks/${taskId}`)
        .then(() => {
          this.trash = this.trash.filter((task) => task.id !== taskId);
        })
        .catch((error) => {
          console.error("Error deleting task from trash:", error);
        });
    },
  },
};
</script>



<style scoped>
.trash-container {
  width: 80%; 
  padding: 20px;
  border-radius: 8px;
  box-shadow: 5px 18px 22px rgba(0, 0, 0, 0.324);
  margin-left: 280px;
  margin-top: 40px;
}

.trash-header {
  margin-bottom: 20px;
  color: #491784;
}

.trash-header h3 {
  font-size: 24px;
  font-weight: bold;
}

.trash-content {
  padding: 15px;
  border-radius: 8px;
  display: block; /* Ensures the content is in a block layout */
}

.full-width-task {
  width: 100%;  /* Ensures each task takes up the full width */
  margin-bottom: 15px;  /* Adds spacing between tasks */
}

.no-tasks {
  text-align: left; /* Aligns the "No tasks" message to the left */
  padding: 20px;
  color: #777;
  display: flex; /* Use flexbox layout */
  align-items: center; /* Vertically center the items */
  justify-content: space-between; /* Align content with space between */
}

.no-tasks p {
  font-size: 16px;
  font-weight: 500;
  margin-right: 20px; /* Add space between the text and the image */
}

.no-tasks img {
  width: 130px; /* Adjust the size of the image */
  height: auto;
  margin-right: 70px;
}

.animated-image {
  width: 100px;
  height: 100px;
  animation: imageZoom 7s ease-in-out infinite; /* Animation lasting 7 seconds */
}

@keyframes imageZoom {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

@media (max-width: 900px) {
  .trash-container {
    width: 80%;
    margin: 0 100px;
    padding: 15px;
  }
}

@media (max-width: 768px) {
  .trash-container {
    width: 80%;
    margin: 0 100px;
    padding: 15px;
  }

  .trash-header h3 {
    font-size: 20px;
  }

  .no-tasks p {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .trash-container {
    padding: 10px;
    margin: 0 400px;
  }

  .trash-header h3 {
    font-size: 18px;
  }

  .no-tasks p {
    font-size: 12px;
  }
}
</style>
