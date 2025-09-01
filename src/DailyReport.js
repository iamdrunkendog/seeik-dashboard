import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Container, Form, Button, Table, Spinner, Alert, Row, Col, Card, ButtonGroup } from 'react-bootstrap';
import './App.css';
import { formatNumber } from './utils/dateUtils';

// Chart.js imports
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

function DailyReport() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [dailyReportData, setDailyReportData] = useState([]);
    const [daysInMonth, setDaysInMonth] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [monthlyTrendData, setMonthlyTrendData] = useState([]);

    const BRAND_COLOR = '#FF7300';

    useEffect(() => {
        const numDays = new Date(year, month, 0).getDate();
        const daysArray = Array.from({ length: numDays }, (_, i) => i + 1);
        setDaysInMonth(daysArray);
    }, [year, month]);

    const handleSearch = useCallback(async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const apiUrl = `https://9w3707plqb.execute-api.ap-northeast-2.amazonaws.com/default/orders/search?year=${year}&month=${month}`;

            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setDailyReportData(data);
            console.log("dailyReportData after fetch:", data);
        } catch (err) {
            console.error("Failed to fetch daily report data:", err);
            setError('일별 매출 데이터를 불러오는 데 실패했습니다.');
            setDailyReportData([]);
        } finally {
            setLoading(false);
        }
    }, [year, month]);

    const fetchMonthlyTrendData = useCallback(async (selectedYear, selectedMonth) => {
        try {
            const apiUrl = `https://9w3707plqb.execute-api.ap-northeast-2.amazonaws.com/default/orders/search?period=12months_trend&year=${selectedYear}&month=${selectedMonth}`;
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setMonthlyTrendData(data);
        } catch (err) {
            console.error("Failed to fetch monthly trend data:", err);
        }
    }, []);

    useEffect(() => {
        handleSearch();
        fetchMonthlyTrendData(year, month);
    }, [handleSearch, fetchMonthlyTrendData, year, month]);

    const storeSalesSummary = useMemo(() => {
        const summary = {};
        dailyReportData.forEach(item => {
            if (!summary[item.store_name]) {
                summary[item.store_name] = {
                    monthly_total: 0,
                    estimated_monthly: 0
                };
            }
            summary[item.store_name].monthly_total += item.monthly_total;
            summary[item.store_name].estimated_monthly += item.estimated_monthly;
        });

        // 전월비, 전년비 계산
        const prevMonthDate = new Date(year, month - 2, 1);
        const prevMonthLabel = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
        const prevYearDate = new Date(year - 1, month - 1, 1);
        const prevYearLabel = `${prevYearDate.getFullYear()}-${String(prevYearDate.getMonth() + 1).padStart(2, '0')}`;

        const trendDataByStore = monthlyTrendData.reduce((acc, item) => {
            const key = `${item.sales_year}-${String(item.sales_month).padStart(2, '0')}`;
            if (!acc[item.store_name]) {
                acc[item.store_name] = {};
            }
            acc[item.store_name][key] = item.total_sales;
            return acc;
        }, {});

        return Object.entries(summary).map(([store_name, data]) => {
            const storeTrend = trendDataByStore[store_name] || {};
            const prevMonthSales = storeTrend[prevMonthLabel] || 0;
            const prevYearSales = storeTrend[prevYearLabel] || 0;

            const mom = prevMonthSales > 0 ? ((data.estimated_monthly - prevMonthSales) / prevMonthSales) * 100 : null;
            const yoy = prevYearSales > 0 ? ((data.estimated_monthly - prevYearSales) / prevYearSales) * 100 : null;

            return {
                store_name,
                ...data,
                mom,
                yoy,
            };
        });
    }, [dailyReportData, monthlyTrendData, year, month]);

    const progressRate = useMemo(() => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;
        const currentDay = today.getDate();

        if (year < currentYear || (year === currentYear && month < currentMonth)) {
            return "100.00";
        } else if (year === currentYear && month === currentMonth) {
            const totalDaysInSelectedMonth = new Date(year, month, 0).getDate();
            return ((currentDay / totalDaysInSelectedMonth) * 100).toFixed(2);
        }
        return null;
    }, [year, month]);

    const chartData = useMemo(() => {
        const labels = [];
        const datasets = {};

        for (let i = 11; i >= 0; i--) {
            const d = new Date(year, month - 1 - i, 1);
            labels.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        }

        monthlyTrendData.forEach(item => {
            if (!datasets[item.store_name]) {
                datasets[item.store_name] = new Array(12).fill(0);
            }
        });

        monthlyTrendData.forEach(item => {
            const monthLabel = `${item.sales_year}-${String(item.sales_month).padStart(2, '0')}`;
            const labelIndex = labels.indexOf(monthLabel);
            if (labelIndex !== -1) {
                if (datasets[item.store_name]) {
                    datasets[item.store_name][labelIndex] = item.total_sales / 1000;
                }
            }
        });

        const colors = ['#FF7300', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
        let colorIndex = 0;

        return {
            labels: labels,
            datasets: Object.keys(datasets).map(storeName => ({
                label: storeName,
                data: datasets[storeName],
                borderColor: colors[colorIndex++ % colors.length],
                backgroundColor: colors[colorIndex % colors.length] + '40',
                tension: 0.1,
                fill: false,
            })),
        };
    }, [monthlyTrendData, year, month]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: '점포별 매출 추이 (직전 12개월, 단위: 천원)',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: '매출액 (천원)',
                },
            },
            x: {
                title: {
                    display: true,
                    text: '월',
                },
            },
        },
    };

    // 월 변경 핸들러 (년도 롤오버 처리)
    const handleMonthChange = (e) => {
        let newMonth = parseInt(e.target.value);
        let newYear = year;

        if (newMonth === 0) {
            newMonth = 12;
            newYear -= 1;
        } else if (newMonth === 13) {
            newMonth = 1;
            newYear += 1;
        }
        setMonth(newMonth);
        setYear(newYear);
    };

    // 월 프리셋 핸들러 (3개월 전, 2개월 전, 지난달)
    const handleMonthPreset = (monthsAgo) => {
        const today = new Date();
        today.setMonth(today.getMonth() - monthsAgo);
        setYear(today.getFullYear());
        setMonth(today.getMonth() + 1);
    };

    // 컨셉별 상세매출 테이블 데이터 처리 (소계 및 총계 포함)
    const processedDetailedData = useMemo(() => {
        if (dailyReportData.length === 0) return [];

        const sortedData = [...dailyReportData].sort((a, b) => a.store_name.localeCompare(b.store_name));

        // 각 점포가 몇 개의 데이터 행을 가지는지 미리 계산
        const storeRowCounts = {};
        sortedData.forEach(item => {
            storeRowCounts[item.store_name] = (storeRowCounts[item.store_name] || 0) + 1;
        });

        const data = [];
        let currentStore = null;
        let storeSubtotalMonthly = 0;
        let storeSubtotalEstimated = 0;
        let storeSubtotalDaily = {};
        let storeColorIndex = 0;

        let grandTotalMonthly = 0;
        let grandTotalEstimated = 0;
        let grandTotalDaily = {};

        daysInMonth.forEach(day => grandTotalDaily[day] = 0);

        const processedStores = new Set();

        sortedData.forEach((item) => {
            if (currentStore && item.store_name !== currentStore) {
                data.push({
                    type: 'subtotal',
                    store_name: currentStore,
                    monthly_total: storeSubtotalMonthly,
                    estimated_monthly: storeSubtotalEstimated,
                    daily_sales_sum: { ...storeSubtotalDaily },
                    colorIndex: storeColorIndex,
                });
                storeColorIndex = 1 - storeColorIndex;
                storeSubtotalMonthly = 0;
                storeSubtotalEstimated = 0;
                daysInMonth.forEach(day => storeSubtotalDaily[day] = 0);
            }

            currentStore = item.store_name;

            if (!processedStores.has(item.store_name)) {
                daysInMonth.forEach(day => storeSubtotalDaily[day] = 0);
                processedStores.add(item.store_name);
            }

            const isFirstInGroup = data.filter(d => d.type === 'data' && d.store_name === item.store_name).length === 0;

            data.push({
                type: 'data',
                ...item,
                colorIndex: storeColorIndex,
                rowSpan: storeRowCounts[item.store_name] + 1,
                isFirstInGroup: isFirstInGroup,
            });

            storeSubtotalMonthly += Number(item.monthly_total);
            storeSubtotalEstimated += Number(item.estimated_monthly);
            daysInMonth.forEach(day => {
                const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                storeSubtotalDaily[day] += (item.daily_sales[dateKey] || 0);
                grandTotalDaily[day] += (item.daily_sales[dateKey] || 0);
            });

            grandTotalMonthly += Number(item.monthly_total);
            grandTotalEstimated += Number(item.estimated_monthly);
        });

        if (currentStore) {
            data.push({
                type: 'subtotal',
                store_name: currentStore,
                monthly_total: storeSubtotalMonthly,
                estimated_monthly: storeSubtotalEstimated,
                daily_sales_sum: { ...storeSubtotalDaily },
                colorIndex: storeColorIndex,
            });
        }

        data.unshift({
            type: 'grandtotal',
            monthly_total: grandTotalMonthly,
            estimated_monthly: grandTotalEstimated,
            daily_sales_sum: { ...grandTotalDaily },
        });

        return data;
    }, [dailyReportData, daysInMonth, year, month]);


    return (
        <Container className="mt-4">
            <h2>매출 일보</h2>

            <Form onSubmit={handleSearch} className="mb-4 p-4 border rounded bg-light">
                <Row className="gy-3 align-items-center">
                    <Col md={6} lg={4}>
                        <Form.Group controlId="yearSelect">
                            <Form.Label className="mt-2">년도</Form.Label>
                            <Form.Control
                                type="number"
                                value={year}
                                onChange={(e) => setYear(parseInt(e.target.value))}
                                required
                            />
                        </Form.Group>
                    </Col>
                    <Col md={6} lg={4}>
                        <Form.Group controlId="monthSelect">
                            <Form.Label className="mt-2">월</Form.Label>
                            <Form.Control
                                type="number"
                                value={month}
                                onChange={handleMonthChange} // 변경된 핸들러 사용
                                required
                            />
                        </Form.Group>
                    </Col>
                    <Col lg={2} className="d-flex align-items-end mt-auto">
                        <Button variant="primary" type="submit" disabled={loading} className="w-100" style={{ backgroundColor: BRAND_COLOR, borderColor: BRAND_COLOR }}>
                            {loading ? <Spinner as="span" animation="border" size="sm" /> : '조회'}
                        </Button>
                    </Col>
                </Row>
                <Row className="mt-3">
                    <Col>
                        <ButtonGroup size="sm">
                            <Button variant="outline-secondary" onClick={() => handleMonthPreset(3)}>3개월 전</Button>
                            <Button variant="outline-secondary" onClick={() => handleMonthPreset(2)}>2개월 전</Button>
                            <Button variant="outline-secondary" onClick={() => handleMonthPreset(1)}>지난달</Button>
                        </ButtonGroup>
                    </Col>
                </Row>
            </Form>

            {error && <Alert variant="danger">{error}</Alert>}

            {loading ? (
                <div className="text-center p-5"><Spinner/></div>
            ) : dailyReportData.length === 0 ? (
                <Alert variant="info">조회된 데이터가 없습니다.</Alert>
            ) : (
                <>
                    {/* 점포별 매출 추이 라인 그래프 */}
                    <h5 className="mt-4">점포별 매출 추이</h5>
                    <Card className="mb-4 w-100">
                        <Card.Body>
                            <div style={{ height: '350px' }}>
                                {monthlyTrendData.length > 0 ? (
                                    <Line data={chartData} options={chartOptions} />
                                ) : (
                                    <Alert variant="info">지난 12개월간의 매출 추이 데이터가 없습니다.</Alert>
                                )}
                            </div>
                        </Card.Body>
                    </Card>

                    {/* 월간 진도율 카드 (새로운 위치) */}
                    {progressRate !== null && (
                        <Card className="mb-4">
                            <Card.Body>
                                <h5 className="mb-0">월간 진도율: {progressRate}%</h5>
                            </Card.Body>
                        </Card>
                    )}

                    {/* 점포별 매출 테이블 */}
                    <h5 className="mt-4">{month}월 점포별 매출 (단위: 천원)</h5>
                    <Card className="mb-4">
                        <Card.Body>
                            <Table bordered hover responsive>
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
                                        <th className="text-end">{formatNumber(storeSalesSummary.reduce((sum, item) => sum + item.monthly_total, 0) / 1000)}</th>
                                        <th className="text-end">{formatNumber(storeSalesSummary.reduce((sum, item) => sum + item.estimated_monthly, 0) / 1000)}</th>
                                        <th className="text-end">
                                            {(() => {
                                                const totalEstimated = storeSalesSummary.reduce((sum, item) => sum + item.estimated_monthly, 0);
                                                
                                                const prevMonthDate = new Date(year, month - 2, 1);
                                                const prevMonthLabel = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
                                                
                                                const totalPrevMonthSales = storeSalesSummary.reduce((sum, item) => {
                                                    const storeTrend = monthlyTrendData.find(t => t.store_name === item.store_name && `${t.sales_year}-${String(t.sales_month).padStart(2, '0')}` === prevMonthLabel);
                                                    return sum + (storeTrend ? storeTrend.total_sales : 0);
                                                }, 0);

                                                const totalMom = totalPrevMonthSales > 0 ? ((totalEstimated - totalPrevMonthSales) / totalPrevMonthSales) * 100 : null;

                                                return totalMom !== null ? (
                                                    <span style={{ color: totalMom > 0 ? 'blue' : 'red' }}>
                                                        {totalMom.toFixed(1)}%
                                                    </span>
                                                ) : '-';
                                            })()}
                                        </th>
                                        <th className="text-end">
                                            {(() => {
                                                const totalEstimated = storeSalesSummary.reduce((sum, item) => sum + item.estimated_monthly, 0);

                                                const prevYearDate = new Date(year - 1, month - 1, 1);
                                                const prevYearLabel = `${prevYearDate.getFullYear()}-${String(prevYearDate.getMonth() + 1).padStart(2, '0')}`;

                                                const totalPrevYearSales = storeSalesSummary.reduce((sum, item) => {
                                                    const storeTrend = monthlyTrendData.find(t => t.store_name === item.store_name && `${t.sales_year}-${String(t.sales_month).padStart(2, '0')}` === prevYearLabel);
                                                    return sum + (storeTrend ? storeTrend.total_sales : 0);
                                                }, 0);

                                                const totalYoy = totalPrevYearSales > 0 ? ((totalEstimated - totalPrevYearSales) / totalPrevYearSales) * 100 : null;

                                                return totalYoy !== null ? (
                                                    <span style={{ color: totalYoy > 0 ? 'blue' : 'red' }}>
                                                        {totalYoy.toFixed(1)}%
                                                    </span>
                                                ) : '-';
                                            })()}
                                        </th>
                                    </tr>
                                </tfoot>
                            </Table>
                        </Card.Body>
                    </Card>

                    {/* 컨셉별 상세매출 테이블 */}
                    <h5 className="mt-4">{month}월 일보 (단위: 천원)</h5>
                    <div style={{ overflowX: 'auto' }}>
                        <Table bordered hover responsive>
                            <thead>
                                <tr>
                                    <th>점포</th>
                                    <th>사진유형</th>
                                    {daysInMonth.map(day => (
                                        <th key={day} className="text-end">{day}</th>
                                    ))}
                                    <th>누계</th>
                                    <th>추정</th>
                                </tr>
                            </thead>
                            <tbody>
                                {processedDetailedData.map((row, index) => {
                                    if (row.type === 'grandtotal') {
                                        return (
                                            <tr key="grand-total" className="fw-bold" style={{ backgroundColor: 'white', color: BRAND_COLOR, borderBottom: '3px solid #495057' }}>
                                                <td colSpan="2">전체 합계</td>
                                                {daysInMonth.map(day => <td key={day} className="text-end">{row.daily_sales_sum[day] === 0 ? '-' : formatNumber(row.daily_sales_sum[day] / 1000)}</td>)}
                                                <td className="text-end">{formatNumber(row.monthly_total / 1000)}</td>
                                                <td className="text-end">{formatNumber(Math.round(row.estimated_monthly / 1000))}</td>
                                            </tr>
                                        );
                                    } else if (row.type === 'subtotal') {
                                        return (
                                            <tr key={`subtotal-${row.store_name}`} className={`table-secondary fw-bold store-color-${row.colorIndex}`}>
                                                <td>소계</td>
                                                {daysInMonth.map(day => <td key={day} className="text-end">{row.daily_sales_sum[day] === 0 ? '-' : formatNumber(row.daily_sales_sum[day] / 1000)}</td>)}
                                                <td className="text-end">{formatNumber(row.monthly_total / 1000)}</td>
                                                <td className="text-end">{formatNumber(Math.round(row.estimated_monthly / 1000))}</td>
                                            </tr>
                                        );
                                    } else { // type === 'data'
                                        return (
                                            <tr key={`${row.store_name}-${row.photo_detail_type}-${index}`} className={`store-color-${row.colorIndex}`}>
                                                {row.isFirstInGroup && <td rowSpan={row.rowSpan} style={{verticalAlign: 'middle'}}>{row.store_name}</td>}
                                                <td>{row.photo_detail_type}</td>
                                                {daysInMonth.map(day => {
                                                    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                                    const currentDaySale = row.daily_sales[dateKey] || 0;
                                                    return <td key={day} className="text-end">{currentDaySale === 0 ? '-' : formatNumber(currentDaySale / 1000)}</td>;
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
                </>
            )}
        </Container>
    );
}

export default DailyReport;