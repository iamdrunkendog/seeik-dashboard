import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  Container, Form, Button, Table, Spinner, Alert, Navbar, ButtonGroup, ToggleButton, Card, Row, Col
} from 'react-bootstrap';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { formatDate, getTodayString, getFirstDayOfMonthString, formatNumber } from './utils/dateUtils';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

// --- Main App Component ---
function SalesSummary() {
  // --- State Variables ---
  const [storeName, setStoreName] = useState('BLUESQUARE');
  const [loading, setLoading] = useState({ summary: true, table: true });
  const [error, setError] = useState('');

  // Top summary cards state
  const [todaysSales, setTodaysSales] = useState(0);
  const [todaysOrders, setTodaysOrders] = useState(0);
  const [pieChartData, setPieChartData] = useState(null);
  const [compositionTableData, setCompositionTableData] = useState([]);

  // Bottom table state
  const [periodStartDate, setPeriodStartDate] = useState(getFirstDayOfMonthString());
  const [periodEndDate, setPeriodEndDate] = useState(getTodayString());
  const [periodData, setPeriodData] = useState([]);

  const storeOptions = ['BLUESQUARE', 'GSartcenter'];
  const BRAND_COLOR = '#FF7300';
  const API_BASE_URL = 'https://9w3707plqb.execute-api.ap-northeast-2.amazonaws.com/default/orders/search';

  // --- Data Fetching Logic ---
  const fetchPeriodData = useCallback(async (store, start, end) => {
    setLoading(prev => ({ ...prev, table: true }));
    setError('');
    try {
      const response = await axios.get(API_BASE_URL, {
        params: { store_name: store, start_date: start, end_date: end, summary: 'true' },
      });
      setPeriodData(response.data);
    } catch (err) {
      setError('기간별 데이터를 불러오는 데 실패했습니다.');
      console.error(err);
      setPeriodData([]);
    }
    setLoading(prev => ({ ...prev, table: false }));
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading({ summary: true, table: true });
      setError('');
      const today = getTodayString();

      fetchPeriodData(storeName, getFirstDayOfMonthString(), today);

      try {
        const summaryPromise = axios.get(API_BASE_URL, {
          params: { store_name: storeName, start_date: today, end_date: today, summary: 'true' },
        });
        const detailPromise = axios.get(API_BASE_URL, {
          params: { store_name: storeName, start_date: today, end_date: today },
        });

        const [summaryResponse, detailResponse] = await Promise.all([summaryPromise, detailPromise]);

        if (summaryResponse.data && summaryResponse.data.length > 0) {
          setTodaysSales(summaryResponse.data[0].total_sales || 0);
          setTodaysOrders(summaryResponse.data[0].order_count || 0);
        } else { setTodaysSales(0); setTodaysOrders(0); }

        if (detailResponse.data && detailResponse.data.length > 0) {
          const counts = detailResponse.data.reduce((acc, order) => {
            const type = order.photo_detail_type || 'N/A';
            acc[type] = (acc[type] || 0) + 1; return acc;
          }, {});
          
          const total = detailResponse.data.length;
          const tableData = Object.entries(counts).map(([type, count]) => ({
            type, count, percentage: ((count / total) * 100).toFixed(1),
          })).sort((a, b) => b.count - a.count);
          setCompositionTableData(tableData);

          setPieChartData({
            labels: tableData.map(d => d.type),
            datasets: [{ data: tableData.map(d => d.count), backgroundColor: [BRAND_COLOR, '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'] }],
          });
        } else { setPieChartData(null); setCompositionTableData([]); }
      } catch (err) {
        setError('요약 데이터를 불러오는 데 실패했습니다.');
        console.error(err);
      }
      setLoading(prev => ({ ...prev, summary: false }));
    };

    fetchAllData();
  }, [storeName, fetchPeriodData]);

  const handlePeriodSearch = (e) => {
    e.preventDefault();
    fetchPeriodData(storeName, periodStartDate, periodEndDate);
  };

  const handleDatePreset = (preset) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (preset) {
      case 'this_week':
        start.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
        break;
      case 'last_week':
        end.setDate(today.getDate() - today.getDay());
        start.setDate(end.getDate() - 6);
        break;
      case 'this_month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'last_month':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      default: return;
    }
    const newStartDate = formatDate(start);
    const newEndDate = formatDate(end);
    setPeriodStartDate(newStartDate);
    setPeriodEndDate(newEndDate);
    fetchPeriodData(storeName, newStartDate, newEndDate);
  };

  const periodSummary = useMemo(() => {
    if (!periodData || periodData.length === 0) return { total_sales: 0, order_count: 0 };
    return periodData.reduce((acc, row) => {
      acc.total_sales += Number(row.total_sales);
      acc.order_count += Number(row.order_count);
      return acc;
    }, { total_sales: 0, order_count: 0 });
  }, [periodData]);

  return (
    <Container className="mt-4">
      <div className="mb-4"><ButtonGroup>
          {storeOptions.map((name) => (
            <ToggleButton
              key={name} id={`radio-${name}`} type="radio" variant="outline-secondary" name="storeName" value={name} checked={storeName === name}
              onChange={(e) => setStoreName(e.currentTarget.value)}
              style={storeName === name ? { backgroundColor: BRAND_COLOR, color: 'white', borderColor: BRAND_COLOR } : {}}
            >{name}</ToggleButton>
          ))}
      </ButtonGroup></div>

      <h5>오늘 현황 ({getTodayString()})</h5>
      {loading.summary ? <div className="text-center p-5"><Spinner/></div> : 
        <Row className="gy-4 mb-4">
          <Col xl={4} md={6}><Card><Card.Header>오늘의 총 매출액</Card.Header><Card.Body><Card.Title as="h2" style={{color: BRAND_COLOR}}>₩ {formatNumber(todaysSales)}</Card.Title></Card.Body></Card></Col>
          <Col xl={4} md={6}><Card><Card.Header>오늘의 총 객수</Card.Header><Card.Body><Card.Title as="h2" style={{color: BRAND_COLOR}}>{formatNumber(todaysOrders)} 건</Card.Title></Card.Body></Card></Col>
          <Col xl={4} md={12}><Card><Card.Header>컨셉(Photo Detail)별 구성비</Card.Header><Card.Body>
                {pieChartData ? (
                  <Row><Col md={5} style={{ minHeight: '150px'}}><Pie data={pieChartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} /></Col>
                    <Col md={7}><Table hover size="sm" className="mb-0"><tbody>
                          {compositionTableData.map(item => (<tr key={item.type}><td>{item.type}</td><td className="text-end">{item.count}건</td><td className="text-end">{item.percentage}%</td></tr>))}
                        </tbody></Table></Col></Row>
                ) : '데이터 없음'}
            </Card.Body></Card></Col>
        </Row>}

      <hr/>

      <h5>기간별 매출 현황</h5>
      <Form onSubmit={handlePeriodSearch} className="mb-4 p-4 border rounded bg-light">
        <Row className="gy-3 align-items-center">
          <Col xs={12}>
              <ButtonGroup size="sm">
                  <Button variant="outline-secondary" onClick={() => handleDatePreset('this_week')}>이번 주</Button>
                  <Button variant="outline-secondary" onClick={() => handleDatePreset('last_week')}>지난 주</Button>
                  <Button variant="outline-secondary" onClick={() => handleDatePreset('this_month')}>이번 달</Button>
                  <Button variant="outline-secondary" onClick={() => handleDatePreset('last_month')}>지난 달</Button>
              </ButtonGroup>
          </Col>
          <Col md={6} lg={4}>
            <Form.Group controlId="startDate"><Form.Label className="mt-2">시작일</Form.Label><Form.Control type="date" value={periodStartDate} onChange={(e) => setPeriodStartDate(e.target.value)} required /></Form.Group>
          </Col>
          <Col md={6} lg={4}>
            <Form.Group controlId="endDate"><Form.Label className="mt-2">종료일</Form.Label><Form.Control type="date" value={periodEndDate} onChange={(e) => setPeriodEndDate(e.target.value)} required /></Form.Group>
          </Col>
          <Col lg={2} className="d-flex align-items-end mt-auto">
            <Button variant="primary" type="submit" disabled={loading.table} className="w-100" style={{ backgroundColor: BRAND_COLOR, borderColor: BRAND_COLOR }}>
              {loading.table ? <Spinner as="span" animation="border" size="sm" /> : '조회'}
            </Button>
          </Col>
        </Row>
      </Form>

      {error && <Alert variant="danger">{error}</Alert>}

      {periodData.length > 0 && !loading.table && (
        <Card className="mb-4"><Card.Header>조회 기간 요약</Card.Header><Card.Body><Row>
              <Col><strong>총 매출액:</strong> ₩ {formatNumber(periodSummary.total_sales)}</Col>
              <Col><strong>총 주문 건수:</strong> {formatNumber(periodSummary.order_count)} 건</Col>
        </Row></Card.Body></Card>
      )}

      <Table striped bordered hover responsive>
        <thead><tr><th>날짜</th><th>총 매출액</th><th>총 주문 건수</th></tr></thead>
        <tbody>
          {loading.table ? (
            <tr><td colSpan="3" className="text-center"><Spinner/></td></tr>
          ) : periodData.length > 0 ? (
            periodData.map((row) => (<tr key={row.stat_date}><td>{row.stat_date.split('T')[0]}</td><td>₩ {formatNumber(row.total_sales)}</td><td>{formatNumber(row.order_count)} 건</td></tr>))
          ) : (
            <tr><td colSpan="3" className="text-center">조회된 데이터가 없습니다.</td></tr>
          )}
        </tbody>
      </Table>
    </Container>
  );
}

export default SalesSummary;
