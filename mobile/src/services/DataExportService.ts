// TailTracker Pro Tier Data Export Service
import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';

export interface ExportOptions {
  format: 'csv' | 'pdf';
  dateRange?: {
    start: Date;
    end: Date;
  };
  includePhotos?: boolean;
  dataTypes: ('pets' | 'vaccinations' | 'health_records' | 'appointments' | 'lost_pet_reports')[];
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

class DataExportService {
  /**
   * Export user data - PRO TIER ONLY
   * Available formats: CSV, PDF
   */
  async exportUserData(options: ExportOptions): Promise<ExportResult> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // Check if user has PRO subscription
      const hasProAccess = await this.checkProSubscription(user.user.id);
      if (!hasProAccess) {
        return {
          success: false,
          error: 'Data export is available in Pro tier only. Upgrade to Pro to export your pet data in CSV or PDF format.'
        };
      }

      // Gather data based on selected types
      const exportData = await this.gatherExportData(user.user.id, options);

      // Generate file based on format
      let filePath: string;
      if (options.format === 'csv') {
        filePath = await this.generateCSVExport(exportData, options);
      } else {
        filePath = await this.generatePDFExport(exportData, options);
      }

      return {
        success: true,
        filePath
      };

    } catch (error: any) {
      console.error('Error exporting data:', error);
      return {
        success: false,
        error: error.message || 'Failed to export data'
      };
    }
  }

  /**
   * Share exported file with user
   */
  async shareExportedFile(filePath: string): Promise<void> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(filePath, {
          mimeType: filePath.endsWith('.csv') ? 'text/csv' : 'application/pdf',
          dialogTitle: 'Export your TailTracker data'
        });
      }
    } catch (error) {
      console.error('Error sharing file:', error);
      throw error;
    }
  }

  /**
   * Get available export data types for user
   */
  async getAvailableDataTypes(): Promise<string[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const availableTypes: string[] = [];

      // Check what data user has
      const { data: pets } = await supabase
        .from('pets')
        .select('id')
        .eq('family_id', user.user.id)
        .limit(1);

      if (pets && pets.length > 0) {
        availableTypes.push('pets');

        // Check for vaccinations
        const { data: vaccinations } = await supabase
          .from('pet_vaccinations')
          .select('id')
          .in('pet_id', pets.map(p => p.id))
          .limit(1);

        if (vaccinations && vaccinations.length > 0) {
          availableTypes.push('vaccinations');
        }

        // Check for health records
        const { data: healthRecords } = await supabase
          .from('health_records')
          .select('id')
          .in('pet_id', pets.map(p => p.id))
          .limit(1);

        if (healthRecords && healthRecords.length > 0) {
          availableTypes.push('health_records');
        }

        // Check for appointments
        const { data: appointments } = await supabase
          .from('veterinary_appointments')
          .select('id')
          .in('pet_id', pets.map(p => p.id))
          .limit(1);

        if (appointments && appointments.length > 0) {
          availableTypes.push('appointments');
        }

        // Check for lost pet reports (Pro only)
        const { data: lostReports } = await supabase
          .from('lost_pet_alerts')
          .select('id')
          .eq('reporter_user_id', user.user.id)
          .limit(1);

        if (lostReports && lostReports.length > 0) {
          availableTypes.push('lost_pet_reports');
        }
      }

      return availableTypes;

    } catch (error) {
      console.error('Error getting available data types:', error);
      return [];
    }
  }

  // Private helper methods

  private async checkProSubscription(userId: string): Promise<boolean> {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('subscription_status')
        .eq('auth_user_id', userId)
        .single();

      return user?.subscription_status === 'pro';

    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  private async gatherExportData(userId: string, options: ExportOptions): Promise<any> {
    const exportData: any = {};

    // Get user's pets first
    const { data: pets } = await supabase
      .from('pets')
      .select('*')
      .eq('family_id', userId);

    if (!pets) return exportData;

    const petIds = pets.map(p => p.id);
    exportData.pets = pets;

    // Gather selected data types
    for (const dataType of options.dataTypes) {
      switch (dataType) {
        case 'vaccinations':
          const { data: vaccinations } = await supabase
            .from('pet_vaccinations')
            .select(`
              *,
              pet:pets(name, species)
            `)
            .in('pet_id', petIds)
            .order('date_administered', { ascending: false });
          exportData.vaccinations = vaccinations || [];
          break;

        case 'health_records':
          const { data: healthRecords } = await supabase
            .from('health_records')
            .select(`
              *,
              pet:pets(name, species)
            `)
            .in('pet_id', petIds)
            .order('date_recorded', { ascending: false });
          exportData.health_records = healthRecords || [];
          break;

        case 'appointments':
          const { data: appointments } = await supabase
            .from('veterinary_appointments')
            .select(`
              *,
              pet:pets(name, species),
              veterinarian:veterinarians(name, clinic_name)
            `)
            .in('pet_id', petIds)
            .order('appointment_date', { ascending: false });
          exportData.appointments = appointments || [];
          break;

        case 'lost_pet_reports':
          const { data: lostReports } = await supabase
            .from('lost_pet_alerts')
            .select(`
              *,
              pet:pets(name, species, breed, color)
            `)
            .eq('reporter_user_id', userId)
            .order('created_at', { ascending: false });
          exportData.lost_pet_reports = lostReports || [];
          break;
      }
    }

    // Apply date range filter if specified
    if (options.dateRange) {
      exportData = this.filterDataByDateRange(exportData, options.dateRange);
    }

    return exportData;
  }

  private filterDataByDateRange(data: any, dateRange: { start: Date; end: Date }): any {
    const filtered = { ...data };

    // Filter each data type by its relevant date field
    if (filtered.vaccinations) {
      filtered.vaccinations = filtered.vaccinations.filter((v: any) => {
        const date = new Date(v.date_administered);
        return date >= dateRange.start && date <= dateRange.end;
      });
    }

    if (filtered.health_records) {
      filtered.health_records = filtered.health_records.filter((hr: any) => {
        const date = new Date(hr.date_recorded);
        return date >= dateRange.start && date <= dateRange.end;
      });
    }

    if (filtered.appointments) {
      filtered.appointments = filtered.appointments.filter((apt: any) => {
        const date = new Date(apt.appointment_date);
        return date >= dateRange.start && date <= dateRange.end;
      });
    }

    if (filtered.lost_pet_reports) {
      filtered.lost_pet_reports = filtered.lost_pet_reports.filter((report: any) => {
        const date = new Date(report.created_at);
        return date >= dateRange.start && date <= dateRange.end;
      });
    }

    return filtered;
  }

  private async generateCSVExport(data: any, options: ExportOptions): Promise<string> {
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
    const fileName = `tailtracker-export-${timestamp}.csv`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    let csvContent = '';

    // Export pets data
    if (data.pets && data.pets.length > 0) {
      csvContent += 'PETS\n';
      csvContent += 'Name,Species,Breed,Color,Birth Date,Weight,Microchip,Created Date\n';
      
      data.pets.forEach((pet: any) => {
        csvContent += `"${pet.name || ''}","${pet.species || ''}","${pet.breed || ''}","${pet.color || ''}","${pet.date_of_birth || ''}","${pet.weight_kg || ''}","${pet.microchip_number || ''}","${format(new Date(pet.created_at), 'yyyy-MM-dd')}"\n`;
      });
      csvContent += '\n';
    }

    // Export vaccinations data
    if (data.vaccinations && data.vaccinations.length > 0) {
      csvContent += 'VACCINATIONS\n';
      csvContent += 'Pet Name,Vaccine Name,Date Administered,Next Due Date,Veterinarian,Notes\n';
      
      data.vaccinations.forEach((vacc: any) => {
        csvContent += `"${vacc.pet?.name || ''}","${vacc.vaccine_name || ''}","${format(new Date(vacc.date_administered), 'yyyy-MM-dd')}","${vacc.next_due_date ? format(new Date(vacc.next_due_date), 'yyyy-MM-dd') : ''}","${vacc.veterinarian_name || ''}","${vacc.notes || ''}"\n`;
      });
      csvContent += '\n';
    }

    // Export health records
    if (data.health_records && data.health_records.length > 0) {
      csvContent += 'HEALTH RECORDS\n';
      csvContent += 'Pet Name,Date,Type,Description,Veterinarian,Treatment\n';
      
      data.health_records.forEach((hr: any) => {
        csvContent += `"${hr.pet?.name || ''}","${format(new Date(hr.date_recorded), 'yyyy-MM-dd')}","${hr.record_type || ''}","${hr.description || ''}","${hr.veterinarian_name || ''}","${hr.treatment || ''}"\n`;
      });
      csvContent += '\n';
    }

    // Export appointments
    if (data.appointments && data.appointments.length > 0) {
      csvContent += 'APPOINTMENTS\n';
      csvContent += 'Pet Name,Date,Time,Veterinarian,Clinic,Purpose,Status,Notes\n';
      
      data.appointments.forEach((apt: any) => {
        csvContent += `"${apt.pet?.name || ''}","${format(new Date(apt.appointment_date), 'yyyy-MM-dd')}","${apt.appointment_time || ''}","${apt.veterinarian?.name || ''}","${apt.veterinarian?.clinic_name || ''}","${apt.purpose || ''}","${apt.status || ''}","${apt.notes || ''}"\n`;
      });
      csvContent += '\n';
    }

    // Export lost pet reports
    if (data.lost_pet_reports && data.lost_pet_reports.length > 0) {
      csvContent += 'LOST PET REPORTS\n';
      csvContent += 'Pet Name,Reported Date,Status,Last Seen Location,Description,Contact Name,Contact Phone\n';
      
      data.lost_pet_reports.forEach((report: any) => {
        const location = report.last_seen_location;
        const locationStr = location ? `${location.latitude},${location.longitude}` : '';
        const contactInfo = report.contact_info || {};
        
        csvContent += `"${report.pet?.name || ''}","${format(new Date(report.created_at), 'yyyy-MM-dd')}","${report.status || ''}","${locationStr}","${report.description || ''}","${contactInfo.name || ''}","${contactInfo.phone || ''}"\n`;
      });
      csvContent += '\n';
    }

    // Write CSV file
    await FileSystem.writeAsStringAsync(filePath, csvContent, {
      encoding: FileSystem.EncodingType.UTF8
    });

    return filePath;
  }

  private async generatePDFExport(data: any, options: ExportOptions): Promise<string> {
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
    const fileName = `tailtracker-export-${timestamp}.pdf`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    // Generate HTML content for PDF
    const htmlContent = this.generatePDFHTML(data, options);

    // For now, create a simple text-based PDF placeholder
    // In production, you would use a library like react-native-html-to-pdf
    const pdfContent = `TailTracker Data Export
Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}

${JSON.stringify(data, null, 2)}`;

    await FileSystem.writeAsStringAsync(filePath, pdfContent, {
      encoding: FileSystem.EncodingType.UTF8
    });

    return filePath;
  }

  private generatePDFHTML(data: any, options: ExportOptions): string {
    const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>TailTracker Data Export</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; color: #2196F3; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #1976D2; border-bottom: 2px solid #1976D2; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; }
        .timestamp { color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🐾 TailTracker Data Export</h1>
        <p class="timestamp">Generated: ${timestamp}</p>
      </div>
    `;

    // Add pets section
    if (data.pets && data.pets.length > 0) {
      html += `
      <div class="section">
        <h2>Pet Profiles</h2>
        <table>
          <tr>
            <th>Name</th>
            <th>Species</th>
            <th>Breed</th>
            <th>Birth Date</th>
            <th>Weight</th>
          </tr>
      `;
      
      data.pets.forEach((pet: any) => {
        html += `
          <tr>
            <td>${pet.name || ''}</td>
            <td>${pet.species || ''}</td>
            <td>${pet.breed || ''}</td>
            <td>${pet.date_of_birth || ''}</td>
            <td>${pet.weight_kg ? pet.weight_kg + ' kg' : ''}</td>
          </tr>
        `;
      });
      
      html += '</table></div>';
    }

    // Add other sections similarly...
    // (Vaccinations, Health Records, Appointments, Lost Pet Reports)

    html += '</body></html>';
    return html;
  }
}

export const dataExportService = new DataExportService();