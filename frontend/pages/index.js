import { useState } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Home() {
    const [goal, setGoal] = useState("");
    const [response, setResponse] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [amountRange, setAmountRange] = useState("all");
    const [closeDate, setCloseDate] = useState("");

    // Function to extract quarter and year from goal input
    function extractQuarterAndYear(goalText) {
        const quarterMatch = goalText.match(/Q[1-4]/i);
        const yearMatch = goalText.match(/\b(20\d{2})\b/);
        if (!quarterMatch || !yearMatch) return null;
        return { quarter: quarterMatch[0].toUpperCase(), year: yearMatch[0] };
    }

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        setResponse([]);
    
        if (!goal.trim()) {
            setError("❌ Please enter a goal.");
            setLoading(false);
            return;
        }
    
        const extractedData = extractQuarterAndYear(goal);
        if (!extractedData) {
            setError("❌ Invalid goal format. Use 'Generate Q3 2024 sales report'.");
            setLoading(false);
            return;
        }
    
        try {
            const res = await axios.post("http://localhost:5000/execute-goal", {
                goal, 
                quarter: extractedData.quarter,
                year: extractedData.year
            });
    
            console.log("🔍 Raw API Response:", res.data);
    
            // ✅ Corrected path to records
            const salesData = res.data?.results?.results?.[0]?.data?.data?.records || [];
    
            console.log("📊 Extracted Sales Data:", salesData);
    
            if (!Array.isArray(salesData) || salesData.length === 0) {
                setError("❌ No sales data found.");
                setLoading(false);
                return;
            }
    
            const formattedData = salesData.map(opportunity => ({
                id: opportunity.Id || "N/A",
                name: opportunity.Name?.trim() || "Unnamed",
                amount: opportunity.Amount ? Number(opportunity.Amount) : 0,
                closeDate: opportunity.CloseDate || "N/A"
            }));
    
            console.log("✅ Formatted Data:", formattedData);
            setResponse(formattedData);
        } catch (err) {
            console.error("❌ Fetch error:", err.response?.data || err.message);
            setError(`❌ ${err.response?.data?.error || "Failed to fetch data. Check the server."}`);
        } finally {
            setLoading(false);
        }
    };
    

    // Filter logic
    const filteredData = response.filter(opportunity => {
        return (
            opportunity.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (amountRange === "all" ||
                (amountRange === "low" && opportunity.amount < 10000) ||
                (amountRange === "medium" && opportunity.amount >= 10000 && opportunity.amount <= 50000) ||
                (amountRange === "high" && opportunity.amount > 50000)) &&
            (closeDate === "" || opportunity.closeDate === closeDate)
        );
    });

    return (
        <div className="container">
            <h1>AI-Powered Report & Dashboard Generator</h1>

            <input
                type="text"
                placeholder="Enter goal (e.g., Generate Q3 2024 sales report)"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="input-box"
            />

            <button onClick={handleSubmit} className="submit-button">
                {loading ? "Loading..." : "Submit"}
            </button>

            {error && <p className="error-message">{error}</p>}

            {/* Filters Section */}
            {response.length > 0 && (
                <div className="filter-section">
                    <h2>Filters</h2>
                    <div className="filter-container">
                        {/* Search by Name */}
                        <input
                            type="text"
                            placeholder="Search by Opportunity Name"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-box"
                        />

                        {/* Filter by Amount */}
                        <select
                            value={amountRange}
                            onChange={(e) => setAmountRange(e.target.value)}
                            className="input-box"
                        >
                            <option value="all">All Amounts</option>
                            <option value="low">Less than $10,000</option>
                            <option value="medium">$10,000 - $50,000</option>
                            <option value="high">More than $50,000</option>
                        </select>

                        {/* Filter by Close Date */}
                        <input
                            type="date"
                            value={closeDate}
                            onChange={(e) => setCloseDate(e.target.value)}
                            className="input-box"
                        />
                    </div>
                </div>
            )}

            {/* Table View */}
            {filteredData.length > 0 ? (
                <div>
                    <h2>Sales Opportunities</h2>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Opportunity Name</th>
                                <th>Amount</th>
                                <th>Close Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((opportunity) => (
                                <tr key={opportunity.id}>
                                    <td>{opportunity.name}</td>
                                    <td>${opportunity.amount.toLocaleString()}</td>
                                    <td>{opportunity.closeDate}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Chart View */}
                    <div className="chart-container">
                        <h2>Sales Performance Chart</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={filteredData}>
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="amount" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            ) : (
                response.length > 0 && <p>No results match the filters.</p>
            )}
        </div>
    );
}
