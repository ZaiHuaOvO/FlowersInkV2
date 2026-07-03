import { NgStyle } from "@angular/common";
import { Component } from "@angular/core";
import { NzFloatButtonModule } from "ng-zorro-antd/float-button";
import { NzIconModule } from "ng-zorro-antd/icon";

@Component({
  selector: "flower-back-top",
  standalone: true,
  imports: [NzFloatButtonModule, NzIconModule],
  templateUrl: "./back-top.component.html",
  styleUrl: "./back-top.component.css",
})
export class BackTopComponent {}
