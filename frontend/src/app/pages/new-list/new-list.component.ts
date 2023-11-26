import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { List } from 'src/app/models/list.model';
import { TaskService } from 'src/app/task.service';

@Component({
  selector: 'app-new-list',
  templateUrl: './new-list.component.html',
  styleUrls: ['./new-list.component.scss']
})
export class NewListComponent implements OnInit{

  constructor(private taskService: TaskService, private router: Router){}
  ngOnInit(){}

  createList(title: string){
    this.taskService.createList(title).subscribe((list: any) => {
      console.log(list);
      //now we navigate back to /lists/response._id
      this.router.navigate(['/lists', list._id]);
    });
  }

}
