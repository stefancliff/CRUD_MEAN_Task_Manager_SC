import { Component } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { TaskService } from 'src/app/task.service';

@Component({
  selector: 'app-edit-task',
  templateUrl: './edit-task.component.html',
  styleUrls: ['./edit-task.component.scss']
})
export class EditTaskComponent {

  constructor(private taskService: TaskService, private route: ActivatedRoute, private router: Router){ }

  taskId!: string;
  listId!: string;

  ngOnInit() {
    this.route.params.subscribe(
      (params: Params) => {
        this.listId = params['listId'];
        this.taskId = params['taskId'];
      }
    )
  }

  updateTask(taskTitle: string){
    this.taskService.updateTask(this.listId, this.taskId, taskTitle).subscribe(() =>{
      this.router.navigate(['/lists', this.listId]);
    })
  }
}
