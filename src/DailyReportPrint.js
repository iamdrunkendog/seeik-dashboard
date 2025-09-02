import React from 'react';
import { Button, Card, Table, Row, Col } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import { formatNumber } from './utils/dateUtils';
import './DailyReportPrint.css';

function DailyReportPrint({ 
    year, 
    month, 
    chartData, 
    chartOptions, 
    storeSalesSummary, 
    processedDetailedData, 
    daysInMonth, 
    handleClose, 
    monthlyTrendData 
}) {

    const handlePrint = () => {
        window.print();
    };

    // Total calculation for summary table footer
    const summaryFooter = React.useMemo(() => {
        const totalMonthly = storeSalesSummary.reduce((sum, item) => sum + item.monthly_total, 0);
        const totalEstimated = storeSalesSummary.reduce((sum, item) => sum + item.estimated_monthly, 0);

        const prevMonthDate = new Date(year, month - 2, 1);
        const prevMonthLabel = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
        const totalPrevMonthSales = monthlyTrendData.reduce((sum, item) => {
            const key = `${item.sales_year}-${String(item.sales_month).padStart(2, '0')}`;
            if (key === prevMonthLabel) {
                return sum + item.total_sales;
            }
            return sum;
        }, 0);
        const totalMom = totalPrevMonthSales > 0 ? ((totalEstimated - totalPrevMonthSales) / totalPrevMonthSales) * 100 : null;

        const prevYearDate = new Date(year - 1, month - 1, 1);
        const prevYearLabel = `${prevYearDate.getFullYear()}-${String(prevYearDate.getMonth() + 1).padStart(2, '0')}`;
        const totalPrevYearSales = monthlyTrendData.reduce((sum, item) => {
            const key = `${item.sales_year}-${String(item.sales_month).padStart(2, '0')}`;
            if (key === prevYearLabel) {
                return sum + item.total_sales;
            }
            return sum;
        }, 0);
        const totalYoy = totalPrevYearSales > 0 ? ((totalEstimated - totalPrevYearSales) / totalPrevYearSales) * 100 : null;

        return { totalMonthly, totalEstimated, totalMom, totalYoy };
    }, [storeSalesSummary, monthlyTrendData, year, month]);

    return (
        <div className="print-container">
            <div className="print-header">
                <h3>{year}년 {month}월 매출 일보 (전체화면)</h3>
                <div>
                    <Button variant="secondary" onClick={handleClose} className="me-2">닫기</Button>
                    <Button variant="primary" onClick={handlePrint}>인쇄하기</Button>
                </div>
            </div>

            <div className="print-content">
                <div className="print-top-section">
                    <div className="print-top-left">
                        <Card className="h-100">
                            <Card.Body className="d-flex flex-column">
                                <Card.Title>점포별 매출 추이</Card.Title>
                                <div style={{ flexGrow: 1, position: 'relative' }}>
                                    <Line data={chartData} options={{ ...chartOptions, maintainAspectRatio: false }} />
                                </div>
                            </Card.Body>
                        </Card>
                    </div>
                    <div className="print-top-right">
                        <Card className="h-100">
                            <Card.Body>
                                <Card.Title>{month}월 점포별 매출</Card.Title>
                                <Table bordered hover responsive className="mb-0">
                                    <thead>
                                        <tr>
                                            <th>점포</th>
                                            <th>누계</th>
                                            <th>추정</th>
                                            <th>전월비</th>
                                            <th>전년비</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {storeSalesSummary.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.store_name}</td>
                                                <td className="text-end">{formatNumber(item.monthly_total / 1000)}</td>
                                                <td className="text-end">{formatNumber(item.estimated_monthly / 1000)}</td>
                                                <td className="text-end">
                                                    {item.mom !== null ? (
                                                        <span style={{ color: item.mom > 0 ? 'blue' : 'red' }}>
                                                            {item.mom.toFixed(1)}%
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                                <td className="text-end">
                                                    {item.yoy !== null ? (
                                                        <span style={{ color: item.yoy > 0 ? 'blue' : 'red' }}>
                                                            {item.yoy.toFixed(1)}%
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="fw-bold">
                                            <th>합계</th>
                                            <th className="text-end">{formatNumber(summaryFooter.totalMonthly / 1000)}</th>
                                            <th className="text-end">{formatNumber(summaryFooter.totalEstimated / 1000)}</th>
                                            <th className="text-end">
                                                {summaryFooter.totalMom !== null ? (
                                                    <span style={{ color: summaryFooter.totalMom > 0 ? 'blue' : 'red' }}>
                                                        {summaryFooter.totalMom.toFixed(1)}%
                                                    </span>
                                                ) : '-'}
                                            </th>
                                            <th className="text-end">
                                                {summaryFooter.totalYoy !== null ? (
                                                    <span style={{ color: summaryFooter.totalYoy > 0 ? 'blue' : 'red' }}>
                                                        {summaryFooter.totalYoy.toFixed(1)}%
                                                    </span>
                                                ) : '-'}
                                            </th>
                                        </tr>
                                    </tfoot>
                                </Table>
                            </Card.Body>
                        </Card>
                    </div>
                </div>

                <div className="print-bottom-section">
                    <h5 className="mb-3">{month}월 일보 상세 (단위: 천원)</h5>
                    <div className="table-container">
                        <Table bordered hover responsive className="detailed-report-table m-0">
                            <thead>
                                <tr>
                                    <th className="sticky-col sticky-col-1 col-store-name">점포</th>
                                    <th className="sticky-col sticky-col-2">사진유형</th>
                                    {daysInMonth.map(day => (
                                        <th key={day} className="text-end day-column">{day}</th>
                                    ))}
                                    <th className="col-nowrap">누계</th>
                                    <th>추정</th>
                                </tr>
                            </thead>
                            <tbody>
                                {processedDetailedData.map((row, index) => {
                                    if (row.type === 'grandtotal') {
                                        return (
                                            <tr key="grand-total" className="fw-bold" style={{ backgroundColor: 'white', color: '#FF7300', borderBottom: '3px solid #495057' }}>
                                                <td className="sticky-col sticky-col-1">전체</td><td className="sticky-col sticky-col-2">합계</td>
                                                {daysInMonth.map(day => <td key={day} className="text-end day-column">{row.daily_sales_sum[day] === 0 ? '-' : formatNumber(row.daily_sales_sum[day] / 1000)}</td>)}
                                                <td className="text-end">{formatNumber(row.monthly_total / 1000)}</td>
                                                <td className="text-end">{formatNumber(Math.round(row.estimated_monthly / 1000))}</td>
                                            </tr>
                                        );
                                    } else if (row.type === 'subtotal') {
                                        return (
                                            <tr key={`subtotal-${row.store_name}`} className={`fw-bold store-color-${row.colorIndex}`}>
                                                <td className="sticky-col sticky-col-2">소계</td>
                                                {daysInMonth.map(day => <td key={day} className="text-end day-column">{row.daily_sales_sum[day] === 0 ? '-' : formatNumber(row.daily_sales_sum[day] / 1000)}</td>)}
                                                <td className="text-end">{formatNumber(row.monthly_total / 1000)}</td>
                                                <td className="text-end">{formatNumber(Math.round(row.estimated_monthly / 1000))}</td>
                                            </tr>
                                        );
                                    } else { // type === 'data'
                                        return (
                                            <tr key={`${row.store_name}-${row.photo_detail_type}-${index}`} className={`${row.isFirstInGroup ? 'new-store-row' : ''} store-color-${row.colorIndex}`}>
                                                {row.isFirstInGroup && <td rowSpan={row.rowSpan} style={{verticalAlign: 'middle'}} className="sticky-col sticky-col-1 col-store-name">{row.store_name}</td>}
                                                <td className="sticky-col sticky-col-2">{row.photo_detail_type}</td>
                                                {daysInMonth.map(day => {
                                                    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                                    const currentDaySale = row.daily_sales[dateKey] || 0;
                                                    return <td key={day} className="text-end day-column">{currentDaySale === 0 ? '-' : formatNumber(currentDaySale / 1000)}</td>;
                                                })}
                                                <td className="text-end">{formatNumber(row.monthly_total / 1000)}</td>
                                                <td className="text-end">{formatNumber(Math.round(row.estimated_monthly / 1000))}</td>
                                            </tr>
                                        );
                                    }
                                })}
                            </tbody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DailyReportPrint;
