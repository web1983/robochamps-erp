# MongoDB Connection Troubleshooting

## SSL/TLS Error Fix

If you're seeing SSL errors like:
```
SSL routines:ssl3_read_bytes:tlsv1 alert internal error
```

### Step 1: Check MongoDB Atlas IP Whitelist

1. Go to MongoDB Atlas Dashboard
2. Click "Network Access" (left sidebar)
3. Click "Add IP Address"
4. Add `0.0.0.0/0` (allows all IPs) OR your current IP
5. Wait 1-2 minutes for changes to take effect

### Step 2: Verify Connection String

Your `.env.local` should have:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/robochamps_erp?retryWrites=true&w=majority
```

**Important:**
- Replace `username` with your MongoDB username
- Replace `password` with your MongoDB password (URL-encode special characters)
- Replace `cluster.mongodb.net` with your actual cluster address
- Make sure there are NO spaces in the connection string

### Step 3: Test Connection

1. Open: http://localhost:3000/api/test-db
2. If it shows "MongoDB connection successful" → Connection is working
3. If it shows an error → Check the error message

### Step 4: Common Issues

**Issue: "Authentication failed"**
- Check username and password in connection string
- Make sure password is URL-encoded (e.g., `@` becomes `%40`)

**Issue: "IP not whitelisted"**
- Add your IP to MongoDB Atlas Network Access
- Or use `0.0.0.0/0` for testing (less secure but works)

**Issue: "SSL/TLS error"**
- Make sure connection string starts with `mongodb+srv://`
- Check if your network/firewall is blocking MongoDB

**Issue: "Connection timeout"**
- Check internet connection
- Verify MongoDB cluster is running (check Atlas dashboard)
- Try increasing timeout in `lib/mongodb.ts`

### Step 5: Verify Connection String Format

Correct format:
```
mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/DATABASE?retryWrites=true&w=majority
```

Example:
```
mongodb+srv://web_db_user:MyPass123@cluster0.abc123.mongodb.net/robochamps_erp?retryWrites=true&w=majority
```

### Step 6: Restart Server

After fixing connection string:
1. Stop the server (Ctrl+C)
2. Restart: `npm run dev`
3. Test again

## Still Having Issues?

1. Check MongoDB Atlas dashboard - is cluster running?
2. Check your internet connection
3. Try connecting from MongoDB Compass (desktop app) with same connection string
4. Check terminal/console for specific error messages
