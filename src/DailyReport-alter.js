                                {processedDetailedData.map((row, index) => {
                                    if (row.type === 'grandtotal') {
                                        return (
                                            <tr key="grand-total" className="fw-bold" style={{ backgroundColor: BRAND_COLOR, color: 'white' }}>
                                                <td colSpan="2">전체 합계</td>
                                                {daysInMonth.map(day => <td key={day} className="text-end">{row.daily_sales_sum[day] === 0 ? '-' : formatNumber(row.daily_sales_sum[day] / 1000)}</td>)}
                                                <td className="text-end">{formatNumber(row.monthly_total / 1000)}</td>
                                                <td className="text-end">{formatNumber(Math.round(row.estimated_monthly / 1000))}</td>
                                            </tr>
                                        );
                                    } else if (row.type === 'subtotal') {
                                        return (
                                            <tr key={`subtotal-${row.store_name}`} className={`table-secondary fw-bold store-color-${row.colorIndex}`}>
                                                <td colSpan="2">{row.store_name} 소계</td>
                                                {daysInMonth.map(day => <td key={day} className="text-end">{row.daily_sales_sum[day] === 0 ? '-' : formatNumber(row.daily_sales_sum[day] / 1000)}</td>)}
                                                <td className="text-end">{formatNumber(row.monthly_total / 1000)}</td>
                                                <td className="text-end">{formatNumber(Math.round(row.estimated_monthly / 1000))}</td>
                                            </tr>
                                        );
                                    } else { // type === 'data'
                                        const isNewStore = index === 0 || row.store_name !== processedDetailedData[index - 1].store_name;
                                        const rowStyle = isNewStore ? { borderTop: '3px solid #dee2e6' } : {};

                                        return (
                                            <tr key={`${row.store_name}-${row.photo_detail_type}-${index}`} className={`store-color-${row.colorIndex}`} style={rowStyle}>
                                                <td>{row.store_name}</td>
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