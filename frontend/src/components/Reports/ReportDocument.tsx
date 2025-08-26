import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { TimeFrame } from '../NewDistributor/types';
import { DistributorDashboardData } from '../../services/distributorDataService';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/formatters';
import { 
  formatTimeFrame, 
  calculateDaysUntilStockout, 
  getStockoutStatus,
  calculateRecommendedOrder,
  sortPartsByCriticality
} from './reportUtils';

// Define styles for PDF document
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#646464',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 20,
    color: '#333',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 10,
    color: '#333',
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
    color: '#333',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#dddddd',
    alignItems: 'center',
    height: 24,
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
  },
  tableHeaderCell: {
    fontSize: 10,
    padding: 5,
    fontWeight: 'bold',
  },
  tableCell: {
    fontSize: 10,
    padding: 5,
  },
  col1: { width: '30%' },
  col2: { width: '20%' },
  col3: { width: '20%' },
  col4: { width: '30%' },
  flexRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  halfWidth: {
    width: '50%',
  },
  thirdWidth: {
    width: '33%',
  },
  quarterWidth: {
    width: '25%',
  },
  metricBox: {
    margin: 5,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 5,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  metricLabel: {
    fontSize: 10,
    color: '#666',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: '#646464',
    paddingTop: 10,
    fontSize: 10,
    textAlign: 'center',
    color: '#666',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 15,
    right: 30,
    fontSize: 10,
    color: '#666',
  },
  critical: {
    color: '#d9534f',
  },
  warning: {
    color: '#f0ad4e',
  },
  success: {
    color: '#5cb85c',
  },
  neutral: {
    color: '#5bc0de',
  },
  regionHighlight: {
    backgroundColor: '#e9ecef',
    padding: 8,
    borderRadius: 4,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  regionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionWrapper: {
    marginBottom: 30,
  }
});

// Report props interface
interface ReportProps {
  data: {
    timeFrame: TimeFrame;
    data: DistributorDashboardData;
  }[];
  locationName: string;
  generatedDate: string;
}

/**
 * Creates the PDF report document
 */
export const createReport = ({ data, locationName, generatedDate }: ReportProps) => (
  <Document>
    {/* Cover Page */}
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Automotive Parts Distribution Report</Text>
        <Text style={styles.subtitle}>Location: {locationName}</Text>
        <Text style={styles.subtitle}>Generated: {generatedDate}</Text>
      </View>
      
      {/* Region Highlight Box */}
      <View style={styles.regionHighlight}>
        <Text style={styles.regionTitle}>{locationName} Market Overview</Text>
        <Text style={styles.text}>
          This report provides a comprehensive analysis of parts distribution data specifically for {locationName},
          including demand forecasts across multiple time frames, current inventory status, and actionable
          recommendations for optimizing your stocking levels.
        </Text>
      </View>
      
      <View>
        <Text style={styles.sectionTitle}>Executive Summary</Text>
        <Text style={styles.text}>
          Based on regional vehicle demographics and historical part failure patterns, we've identified
          specific stocking opportunities to maximize your revenue potential and service level in this market.
          The analysis below highlights key metrics and prioritized recommendations for your location.
        </Text>
        
        {/* Key Metrics Summary */}
        <View style={[styles.flexRow, { marginTop: 20, flexWrap: 'wrap' }]}>
          {data.map((timeData, index) => (
            <View key={index} style={styles.quarterWidth}>
              <View style={styles.metricBox}>
                <Text style={styles.subsectionTitle}>
                  {formatTimeFrame(timeData.timeFrame)}
                </Text>
                <Text style={styles.metricValue}>
                  {formatNumber(timeData.data.metrics.predictedDemandUnits)}
                </Text>
                <Text style={styles.metricLabel}>Predicted Demand Units</Text>
                
                <Text style={[styles.metricValue, { marginTop: 10 }]}>
                  {formatCurrency(timeData.data.metrics.revenueOpportunity)}
                </Text>
                <Text style={styles.metricLabel}>Est. Revenue</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
      
      <Text style={styles.footer}>
        Vehicast Distribution Report - Confidential
      </Text>
      <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
        `${pageNumber} / ${totalPages}`
      )} fixed />
    </Page>
    
    {/* Inventory Analysis Page */}
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory Analysis</Text>
        <Text style={styles.subtitle}>Location: {locationName}</Text>
      </View>
      
      <View style={styles.sectionWrapper}>
        <Text style={styles.sectionTitle}>Critical Stocking Needs</Text>
        <Text style={styles.text}>
          The following table shows parts with critical stocking needs based on a 6-month forecast.
          These parts should be prioritized for immediate restocking to avoid lost sales opportunities.
        </Text>
        
        {/* Critical Parts Table */}
        <View style={{ marginTop: 10 }}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableHeaderCell, { width: '28%' }]}>Part Name</Text>
            <Text style={[styles.tableHeaderCell, { width: '14%' }]}>Current Stock</Text>
            <Text style={[styles.tableHeaderCell, { width: '14%' }]}>Est. Demand</Text>
            <Text style={[styles.tableHeaderCell, { width: '22%' }]}>Est. Revenue</Text>
            <Text style={[styles.tableHeaderCell, { width: '22%' }]}>Days to Stock-Out</Text>
          </View>
          
          {sortPartsByCriticality(data
            .find(d => d.timeFrame === '6months')?.data.stockingRecommendations || [])
            .filter(part => part.status === 'Critical' || part.status === 'Low')
            .slice(0, 10)
            .map((part, index) => {
              const daysUntilStockout = calculateDaysUntilStockout(
                part.currentStock, 
                part.estimatedDemand, 
                '6months'
              );
              const stockoutStatus = getStockoutStatus(daysUntilStockout);
              const statusStyle = 
                daysUntilStockout <= 7 ? styles.critical :
                daysUntilStockout <= 30 ? styles.warning :
                styles.neutral;
              
              return (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { width: '28%' }]}>{part.partName}</Text>
                  <Text style={[styles.tableCell, { width: '14%' }]}>{formatNumber(part.currentStock)}</Text>
                  <Text style={[styles.tableCell, { width: '14%' }]}>{formatNumber(part.estimatedDemand)}</Text>
                  <Text style={[styles.tableCell, { width: '22%' }]}>
                    {formatCurrency(part.revenueOpportunity)}
                  </Text>
                  <Text style={[styles.tableCell, statusStyle, { width: '22%' }]}>
                    {stockoutStatus}
                  </Text>
                </View>
              );
            })}
        </View>
      </View>
      
      <View style={styles.sectionWrapper}>
        <Text style={styles.sectionTitle}>Demand Forecasts by Timeframe</Text>
        <Text style={styles.text}>
          Comparing predicted demand across different time periods helps identify trends and
          seasonal patterns that affect inventory planning.
        </Text>
        
        {/* Timeframe Comparison */}
        <View style={{ marginTop: 15 }}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Time Period</Text>
            <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Total Demand</Text>
            <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Critical Items</Text>
            <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Coverage Ratio</Text>
          </View>
          
          {data.map((timeData, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '25%' }]}>
                {formatTimeFrame(timeData.timeFrame)}
              </Text>
              <Text style={[styles.tableCell, { width: '25%' }]}>
                {formatNumber(timeData.data.metrics.predictedDemandUnits)}
              </Text>
              <Text style={[styles.tableCell, { width: '25%' }]}>
                {timeData.data.metrics.criticalItems}
              </Text>
              <Text style={[styles.tableCell, { width: '25%' }]}>
                {formatPercent(timeData.data.metrics.partsCoverageRatio)}
              </Text>
            </View>
          ))}
        </View>
      </View>
      
      <Text style={styles.footer}>
        Vehicast Distribution Report - Confidential
      </Text>
      <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
        `${pageNumber} / ${totalPages}`
      )} fixed />
    </Page>
    
    {/* Vehicle Analysis Page */}
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Vehicle Analysis</Text>
        <Text style={styles.subtitle}>Location: {locationName}</Text>
      </View>
      
      <View style={styles.sectionWrapper}>
        <Text style={styles.sectionTitle}>Vehicle Demographics</Text>
        <Text style={styles.text}>
          Understanding the vehicle population in your area helps anticipate parts demand.
          The following table shows the top vehicles by registration count in {locationName}.
        </Text>
        
        {/* Vehicles Table */}
        <View style={{ marginTop: 10 }}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Make</Text>
            <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Model</Text>
            <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Year</Text>
            <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Est. Mileage</Text>
            <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Registrations</Text>
          </View>
          
          {data[0].data.vehicleData.slice(0, 15).map((vehicle, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '20%' }]}>{vehicle.make}</Text>
              <Text style={[styles.tableCell, { width: '25%' }]}>{vehicle.model}</Text>
              <Text style={[styles.tableCell, { width: '15%' }]}>{vehicle.year}</Text>
              <Text style={[styles.tableCell, { width: '20%' }]}>
                {formatNumber(vehicle.estimatedMileage)}
              </Text>
              <Text style={[styles.tableCell, { width: '20%' }]}>
                {formatNumber(vehicle.registrations)}
              </Text>
            </View>
          ))}
        </View>
      </View>
      
      {/* Start Parts Failure Analysis on a new page */}
      <Text style={styles.footer}>
        Vehicast Distribution Report - Confidential
      </Text>
      <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
        `${pageNumber} / ${totalPages}`
      )} fixed />
    </Page>
    
    {/* Parts Failure Analysis Page */}
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Parts Failure Analysis</Text>
        <Text style={styles.subtitle}>Location: {locationName}</Text>
      </View>
      
      <View>
        <Text style={styles.sectionTitle}>Parts Failure Patterns</Text>
        <Text style={styles.text}>
          Based on vehicle population and mileage patterns, the following parts categories
          are expected to have the highest failure rates in the next 6 months in {locationName}.
        </Text>
        
        {/* Parts Category Insights */}
        <View style={{ marginTop: 15 }}>
          <View style={styles.flexRow}>
            <View style={styles.halfWidth}>
              <View style={styles.metricBox}>
                <Text style={styles.subsectionTitle}>Brake Systems</Text>
                <Text style={styles.text}>High demand anticipated due to the large number of vehicles in the 60,000-80,000 mile range.</Text>
              </View>
            </View>
            <View style={styles.halfWidth}>
              <View style={styles.metricBox}>
                <Text style={styles.subsectionTitle}>Suspension Components</Text>
                <Text style={styles.text}>Expected increase in demand as vehicles reach 3-5 years of age.</Text>
              </View>
            </View>
          </View>
          <View style={styles.flexRow}>
            <View style={styles.halfWidth}>
              <View style={styles.metricBox}>
                <Text style={styles.subsectionTitle}>Electrical Systems</Text>
                <Text style={styles.text}>Steady demand across all vehicle ages, with higher failure rates in older models.</Text>
              </View>
            </View>
            <View style={styles.halfWidth}>
              <View style={styles.metricBox}>
                <Text style={styles.subsectionTitle}>Climate Control</Text>
                <Text style={styles.text}>Seasonal peak expected as summer approaches.</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
      
      <Text style={styles.footer}>
        Vehicast Distribution Report - Confidential
      </Text>
      <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
        `${pageNumber} / ${totalPages}`
      )} fixed />
    </Page>
    
    {/* Smart Stocking Recommendations Page */}
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Smart Stocking Analysis</Text>
        <Text style={styles.subtitle}>Location: {locationName}</Text>
      </View>
      
      <View style={styles.sectionWrapper}>
        <Text style={styles.sectionTitle}>Intelligent Stocking Recommendations</Text>
        <Text style={styles.text}>
          Our advanced stocking algorithm has analyzed your current inventory levels against projected demand
          in {locationName} and generated the following specific recommendations to optimize your inventory:
        </Text>
        
        {/* Top Urgent Restocking Needs */}
        <Text style={styles.subsectionTitle}>Top Urgent Restocking Needs</Text>
        <View style={{ marginTop: 8 }}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableHeaderCell, { width: '26%' }]}>Part</Text>
            <Text style={[styles.tableHeaderCell, { width: '14%' }]}>Current</Text>
            <Text style={[styles.tableHeaderCell, { width: '14%' }]}>Demand</Text>
            <Text style={[styles.tableHeaderCell, { width: '18%' }]}>Days Until Out</Text>
            <Text style={[styles.tableHeaderCell, { width: '14%' }]}>Order Qty</Text>
            <Text style={[styles.tableHeaderCell, { width: '14%' }]}>Lost Revenue</Text>
          </View>
          
          {sortPartsByCriticality(
            data.find(d => d.timeFrame === '6months')?.data.stockingRecommendations || []
          )
            .slice(0, 8)
            .map((part, index) => {
              const daysUntilStockout = calculateDaysUntilStockout(
                part.currentStock, 
                part.estimatedDemand, 
                '6months'
              );
              
              const recommendedOrder = calculateRecommendedOrder(
                part.currentStock,
                part.estimatedDemand
              );
              
              const unitPrice = part.revenueOpportunity / (
                Math.max(0, part.estimatedDemand - part.currentStock) || 1
              );
              
              return (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { width: '26%' }]}>
                    {part.partName}
                  </Text>
                  <Text style={[styles.tableCell, { width: '14%' }]}>
                    {formatNumber(part.currentStock)}
                  </Text>
                  <Text style={[styles.tableCell, { width: '14%' }]}>
                    {formatNumber(part.estimatedDemand)}
                  </Text>
                  <Text 
                    style={[
                      styles.tableCell, 
                      daysUntilStockout <= 7 ? styles.critical : 
                      daysUntilStockout <= 30 ? styles.warning : 
                      styles.neutral,
                      { width: '18%' }
                    ]}
                  >
                    {getStockoutStatus(daysUntilStockout)}
                  </Text>
                  <Text style={[styles.tableCell, styles.success, { width: '14%' }]}>
                    {formatNumber(recommendedOrder)}
                  </Text>
                  <Text style={[styles.tableCell, { width: '14%' }]}>
                    {formatCurrency(daysUntilStockout <= 180 ? part.revenueOpportunity : 0)}
                  </Text>
                </View>
              );
            })}
        </View>
      </View>
      
      {/* Put Inventory Optimization Strategy on a new page */}
      <Text style={styles.footer}>
        Vehicast Distribution Report - Confidential
      </Text>
      <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
        `${pageNumber} / ${totalPages}`
      )} fixed />
    </Page>
    
    {/* Inventory Optimization Strategy Page */}
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory Optimization Strategy</Text>
        <Text style={styles.subtitle}>Location: {locationName}</Text>
      </View>
      
      <View>
        <Text style={styles.sectionTitle}>Strategic Recommendations</Text>
        <Text style={styles.text}>
          The following recommendations are designed to optimize your inventory levels,
          free up capital from slow-moving items, and ensure you have the right parts in stock
          for your specific regional demand patterns.
        </Text>
        
        {/* Recommendations */}
        <View style={{ marginTop: 15 }}>
          <Text style={styles.subsectionTitle}>1. Immediate Action Items</Text>
          <Text style={styles.text}>
            • Place orders for the critical parts listed above within 48 hours to prevent stockouts
          </Text>
          <Text style={styles.text}>
            • Prioritize parts with the highest potential lost revenue
          </Text>
          <Text style={styles.text}>
            • Increase safety stock for high-demand items with inconsistent supply chain
          </Text>
          
          <Text style={[styles.subsectionTitle, { marginTop: 15 }]}>2. Medium-Term Strategy (30-90 days)</Text>
          <Text style={styles.text}>
            • Analyze seasonal patterns in the 3-month and 6-month forecasts for {locationName}
          </Text>
          <Text style={styles.text}>
            • Pre-order items with expected demand increases due to seasonal factors
          </Text>
          <Text style={styles.text}>
            • Implement just-in-time ordering for stable demand items with reliable suppliers
          </Text>
          
          <Text style={[styles.subsectionTitle, { marginTop: 15 }]}>3. Capital Optimization</Text>
          <Text style={styles.text}>
            • Identify and reduce overstocked items to free up approximately {formatCurrency(data[0].data.metrics.revenueOpportunity * 0.2)} in capital
          </Text>
          <Text style={styles.text}>
            • Consider regional transfer of slow-moving parts to locations with higher demand
          </Text>
          <Text style={styles.text}>
            • Set up automatic reorder points calibrated to your specific regional demand patterns
          </Text>
        </View>
      </View>
      
      <Text style={styles.footer}>
        Vehicast Distribution Report - Confidential
      </Text>
      <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
        `${pageNumber} / ${totalPages}`
      )} fixed />
    </Page>
    
    {/* Revenue Opportunity Page */}
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Revenue Opportunity Summary</Text>
        <Text style={styles.subtitle}>Location: {locationName}</Text>
      </View>
      
      <View style={styles.sectionWrapper}>
        <Text style={styles.sectionTitle}>Financial Impact Analysis</Text>
        <Text style={styles.text}>
          By implementing the stocking recommendations in this report, you can capture the following 
          revenue opportunities across different timeframes.
        </Text>
        
        {/* Revenue Summary */}
        <View style={{ marginTop: 15 }}>
          <View style={styles.flexRow}>
            {data.map((timeData, index) => (
              <View key={index} style={styles.quarterWidth}>
                <View style={styles.metricBox}>
                  <Text style={styles.subsectionTitle}>
                    {formatTimeFrame(timeData.timeFrame)}
                  </Text>
                  <Text style={styles.metricValue}>
                    {formatCurrency(timeData.data.metrics.revenueOpportunity)}
                  </Text>
                  <Text style={styles.metricLabel}>Est. Revenue Opportunity</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
      
      <View style={styles.sectionWrapper}>
        <Text style={styles.sectionTitle}>Return on Investment</Text>
        <Text style={styles.text}>
          Investing in optimal inventory levels for {locationName} will provide both immediate
          and long-term benefits to your business:
        </Text>
        
        <View style={[styles.flexRow, { marginTop: 15 }]}>
          <View style={styles.halfWidth}>
            <View style={styles.metricBox}>
              <Text style={styles.subsectionTitle}>Short-Term Benefits</Text>
              <Text style={styles.text}>• Capture immediate revenue from critical stockout prevention</Text>
              <Text style={styles.text}>• Improve customer satisfaction through higher fill rates</Text>
              <Text style={styles.text}>• Respond more effectively to local demand patterns</Text>
            </View>
          </View>
          <View style={styles.halfWidth}>
            <View style={styles.metricBox}>
              <Text style={styles.subsectionTitle}>Long-Term Benefits</Text>
              <Text style={styles.text}>• Free up capital from overstock reduction</Text>
              <Text style={styles.text}>• Establish optimized inventory cycles aligned with demand</Text>
              <Text style={styles.text}>• Increase overall inventory turn rate by 15-20%</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Implementation Roadmap on a new page */}
      <Text style={styles.footer}>
        Vehicast Distribution Report - Confidential
      </Text>
      <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
        `${pageNumber} / ${totalPages}`
      )} fixed />
    </Page>
    
    {/* Implementation Roadmap Page */}
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Implementation Roadmap</Text>
        <Text style={styles.subtitle}>Location: {locationName}</Text>
      </View>
      
      <View>
        <Text style={styles.sectionTitle}>Actionable Implementation Plan</Text>
        <Text style={styles.text}>
          To maximize the value of this report, we recommend the following implementation approach:
        </Text>
        
        <View style={{ marginTop: 15 }}>
          <Text style={styles.subsectionTitle}>Week 1-2: Immediate Actions</Text>
          <Text style={styles.text}>
            • Place orders for all critical items to prevent revenue loss
          </Text>
          <Text style={styles.text}>
            • Review and validate the demand forecasts against your local knowledge
          </Text>
          
          <Text style={[styles.subsectionTitle, { marginTop: 15 }]}>Week 3-4: System Configuration</Text>
          <Text style={styles.text}>
            • Update reorder points in your inventory management system
          </Text>
          <Text style={styles.text}>
            • Configure alerts for items approaching critical stocking levels
          </Text>
          
          <Text style={[styles.subsectionTitle, { marginTop: 15 }]}>Month 2-3: Optimization</Text>
          <Text style={styles.text}>
            • Implement the full inventory optimization plan
          </Text>
          <Text style={styles.text}>
            • Begin systematic reduction of identified overstock items
          </Text>
          <Text style={styles.text}>
            • Set up monthly review of actual vs. predicted demand
          </Text>
        </View>
        
        <View style={{ marginTop: 30 }}>
          <Text style={styles.sectionTitle}>Ongoing Monitoring</Text>
          <Text style={styles.text}>
            For continued success with your inventory optimization, we recommend establishing 
            the following regular monitoring practices:
          </Text>
          
          <View style={{ marginTop: 15 }}>
            <Text style={styles.text}>
              • Weekly review of critical parts status and stock levels
            </Text>
            <Text style={styles.text}>
              • Monthly comparison of actual vs. predicted demand by part category
            </Text>
            <Text style={styles.text}>
              • Quarterly analysis of regional vehicle demographics changes
            </Text>
            <Text style={styles.text}>
              • Semi-annual comprehensive inventory optimization review
            </Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.footer}>
        Vehicast Distribution Report - Confidential
      </Text>
      <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
        `${pageNumber} / ${totalPages}`
      )} fixed />
    </Page>
  </Document>
); 