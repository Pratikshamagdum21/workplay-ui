// Angular Core
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { MultiSelectModule } from 'primeng/multiselect';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { PanelModule } from 'primeng/panel';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { FileUploadModule } from 'primeng/fileupload';
import { MenubarModule } from 'primeng/menubar';
import { MenuModule } from 'primeng/menu';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { ChipModule } from 'primeng/chip';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PanelMenuModule } from 'primeng/panelmenu';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';

export const SHARED_IMPORTS = [
    // Angular
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MenuModule,
    PanelMenuModule,
    RouterLink,
    RouterLinkActive,
    // PrimeNG Form Controls
    ButtonModule,
    InputTextModule,
    InputTextModule,
    MultiSelectModule,
    CheckboxModule,
    RadioButtonModule,
    SelectModule,
    FileUploadModule,
    InputNumberModule,
    DatePickerModule,
    // PrimeNG Data
    TableModule,

    // PrimeNG Panels
    CardModule,
    PanelModule,

    // PrimeNG Overlays
    DialogModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,

    // PrimeNG Menu
    MenubarModule,
    MenuModule,
    ToolbarModule,

    // PrimeNG Misc
    ProgressSpinnerModule,
    BadgeModule,
    ChipModule,
    DividerModule,
    TagModule
];
