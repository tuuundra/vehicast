import { saveAs } from 'file-saver';
import { pdf } from '@react-pdf/renderer';
import { TimeFrame } from '../components/NewDistributor/types';
import * as distributorDataService from './distributorDataService';
import { createReport } from '../components/Reports/ReportDocument';

/**
 * Generates a comprehensive distributor report as a PDF file
 * 
 * @param stateId - The ID of the selected state (null for all states)
 * @param countyId - The ID of the selected county (null for all counties)
 * @param currentTimeFrame - The currently selected time frame
 */
export const generateDistributorReport = async (
  stateId: number | null, 
  countyId: number | null, 
  currentTimeFrame: TimeFrame
): Promise<void> => {
  try {
    // Collect data for all time frames
    const timeFrames: TimeFrame[] = ['7days', '1month', '3months', '6months'];
    
    // Show start of generation process in console
    console.log(`Generating report for stateId=${stateId}, countyId=${countyId} across all timeframes`);
    
    // Fetch data for all time frames
    const allTimeFrameData = await Promise.all(
      timeFrames.map(async (timeFrame) => {
        const data = await distributorDataService.getDistributorDashboardData(
          timeFrame,
          stateId,
          countyId
        );
        
        return {
          timeFrame,
          data
        };
      })
    );
    
    // Get region names
    let locationName = 'All Regions';
    
    if (stateId || countyId) {
      const regions = await distributorDataService.loadRegions();
      
      if (countyId) {
        const county = regions.find(r => r.region_id === countyId);
        if (county) {
          const state = regions.find(r => r.region_id === county.parent_region_id);
          locationName = `${county.name}, ${state ? state.name : ''}`;
        }
      } else if (stateId) {
        const state = regions.find(r => r.region_id === stateId);
        if (state) {
          locationName = state.name;
        }
      }
    }
    
    // Create the report document
    const reportDocument = createReport({
      data: allTimeFrameData,
      locationName,
      generatedDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    });
    
    // Generate PDF from document
    const pdfBlob = await pdf(reportDocument).toBlob();
    
    // Format date for filename
    const dateStr = new Date().toISOString().split('T')[0];
    
    // Generate filename based on region
    const filename = `${locationName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_distributor_report_${dateStr}.pdf`;
    
    // Save the PDF file
    saveAs(pdfBlob, filename);
    
    console.log(`Report generated successfully: ${filename}`);
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error generating report:', error);
    return Promise.reject(error);
  }
}; 