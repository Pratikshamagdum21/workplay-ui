import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { SHARED_IMPORTS } from '../../../shared-imports';
import { FabricQualityService } from '../../../../services/fabric-quality.service';

@Component({
  selector: 'app-add-fabric-quality',
  standalone: true,
  imports: [...SHARED_IMPORTS],
  providers: [MessageService],
  templateUrl: './add-fabric-quality.html',
  styleUrl: './add-fabric-quality.scss'
})
export class AddFabricQuality {
  @Output() qualitySaved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  qualityForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private fabricQualityService: FabricQualityService,
    private messageService: MessageService
  ) {
    this.qualityForm = this.fb.group({
      name: ['', Validators.required],
      width: ['', Validators.required],
      fani: [''],
      peak: [''],
      warp: [''],
      weft: ['']
    });
  }

  submit(): void {
    if (this.qualityForm.invalid) {
      this.qualityForm.markAllAsTouched();
      return;
    }

    this.fabricQualityService.addQuality(this.qualityForm.value).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Fabric quality added successfully',
          life: 3000
        });
        this.qualitySaved.emit();
        this.qualityForm.reset();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to add fabric quality',
          life: 3000
        });
      }
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
