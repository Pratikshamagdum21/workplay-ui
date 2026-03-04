import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { SHARED_IMPORTS } from '../../../shared-imports';
import { FabricQuality } from '../model/invoice.model';
import { FabricQualityService } from '../../../../services/fabric-quality.service';

@Component({
  selector: 'app-add-fabric-quality',
  standalone: true,
  imports: [...SHARED_IMPORTS],
  providers: [MessageService],
  templateUrl: './add-fabric-quality.html',
  styleUrl: './add-fabric-quality.scss'
})
export class AddFabricQuality implements OnInit {
  @Input() isEditMode = false;
  @Input() qualityData: FabricQuality | null = null;
  @Output() qualitySaved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  qualityForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private fabricQualityService: FabricQualityService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.qualityForm = this.fb.group({
      name: [this.qualityData?.name || '', Validators.required],
      width: [this.qualityData?.width || '', Validators.required],
      fani: [this.qualityData?.fani || ''],
      peak: [this.qualityData?.peak || ''],
      warp: [this.qualityData?.warp || ''],
      weft: [this.qualityData?.weft || '']
    });
  }

  submit(): void {
    if (this.qualityForm.invalid) {
      this.qualityForm.markAllAsTouched();
      return;
    }

    const operation = this.isEditMode && this.qualityData
      ? this.fabricQualityService.updateQuality(this.qualityData.id, this.qualityForm.value)
      : this.fabricQualityService.addQuality(this.qualityForm.value);

    operation.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: this.isEditMode ? 'Fabric quality updated successfully' : 'Fabric quality added successfully',
          life: 3000
        });
        this.qualitySaved.emit();
        if (!this.isEditMode) {
          this.qualityForm.reset();
        }
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.isEditMode ? 'Failed to update fabric quality' : 'Failed to add fabric quality',
          life: 3000
        });
      }
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
