import { Component, OnInit, OnDestroy } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { SHARED_IMPORTS } from '../../../shared-imports';
import { FabricQuality } from '../model/invoice.model';
import { FabricQualityService } from '../../../../services/fabric-quality.service';
import { AddFabricQuality } from '../add-fabric-quality/add-fabric-quality';

@Component({
  selector: 'app-manage-fabric-qualities',
  standalone: true,
  imports: [...SHARED_IMPORTS, AddFabricQuality],
  providers: [MessageService, ConfirmationService],
  templateUrl: './manage-fabric-qualities.html',
  styleUrl: './manage-fabric-qualities.scss'
})
export class ManageFabricQualities implements OnInit, OnDestroy {
  qualities: FabricQuality[] = [];
  selectedQuality: FabricQuality | null = null;
  loading = false;

  displayAddDialog = false;
  displayEditDialog = false;
  isEditMode = false;

  first = 0;
  rows = 10;
  totalRecords = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private fabricQualityService: FabricQualityService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadQualities();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadQualities(): void {
    this.loading = true;
    this.fabricQualityService.getQualities()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (qualities) => {
          this.qualities = qualities;
          this.totalRecords = qualities.length;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  openAddDialog(): void {
    this.isEditMode = false;
    this.selectedQuality = null;
    this.displayAddDialog = true;
  }

  closeAddDialog(): void {
    this.displayAddDialog = false;
    this.selectedQuality = null;
  }

  onQualityAdded(): void {
    this.displayAddDialog = false;
    this.selectedQuality = null;
    this.first = 0;
  }

  openEditDialog(quality: FabricQuality): void {
    this.isEditMode = true;
    this.selectedQuality = { ...quality };
    this.displayEditDialog = true;
  }

  closeEditDialog(): void {
    this.displayEditDialog = false;
    this.selectedQuality = null;
    this.isEditMode = false;
  }

  onQualityUpdated(): void {
    this.displayEditDialog = false;
    this.selectedQuality = null;
    this.isEditMode = false;
  }

  confirmDelete(quality: FabricQuality): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${quality.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deleteQuality(quality)
    });
  }

  private deleteQuality(quality: FabricQuality): void {
    this.fabricQualityService.deleteQuality(quality.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: `${quality.name} has been deleted`,
          life: 3000
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete fabric quality',
          life: 3000
        });
      }
    });
  }
}
