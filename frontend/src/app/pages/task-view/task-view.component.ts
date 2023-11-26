import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { TaskService } from 'src/app/task.service';
import { Task } from 'src/app/models/task.model';
import { List } from 'src/app/models/list.model';
import { AuthService } from 'src/app/auth.service';

@Component({
  selector: 'app-task-view',
  templateUrl: './task-view.component.html',
  styleUrls: ['./task-view.component.scss']
})
export class TaskViewComponent implements OnInit {

  lists: any;
  tasks: any;
  selectedListId!: string;

  constructor(private taskService: TaskService, private route: ActivatedRoute, private router: Router, private authService: AuthService){}

  ngOnInit(){

    this.route.params.subscribe(
      (params: Params) => {
        if (params['listId']) {
          if(params['listId']){
            this.selectedListId = params['listId'];
            this.taskService.getTasks(params['listId']).subscribe((tasks: any) => {
              this.tasks = tasks;
            })
        } else {
          this.tasks = undefined;
        }
      }
    }
  )
    this.taskService.getLists().subscribe((lists: any) => {
      this.lists = lists;
    })
  }


  onTaskClick(task: Task){
    // Here we set the task to completed when we click on it
    this.taskService.completeTask(task).subscribe(() =>{
      // The task has been set to completed successfully
      console.log("Task completed a-ok!");
      task.completedTask = !task.completedTask;
    })
  }

  onDeleteListClick(){
    this.taskService.deleteList(this.selectedListId).subscribe((res: any) => {
      this.router.navigate(['/lists']);
      console.log(res);
    })
  }

  onDeleteTaskClick(taskId: string){
    this.taskService.deleteTask(this.selectedListId, taskId).subscribe((res: any) => {

      this.tasks = this.tasks.filter((val: { _id: string; }) => val._id !== taskId);
      console.log(res);
    })
  }

  logout(){
    this.authService.logout();
  }
}
