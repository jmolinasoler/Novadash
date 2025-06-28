# Troubleshooting Guide

This guide covers common issues encountered when connecting the Novadashboard application to a `bitcoind` node.

---

## Issue: Network Connection Error (EHOSTUNREACH)

### Symptom
The application fails to start and logs a network-level error, indicating the `bitcoind` host is unreachable.
```
Error connecting to Bitcoin Core: connect EHOSTUNREACH 192.168.142.6:8332
```

Check if the firewall is up or the selinux is in your way, best will be to allow the connection.

```
# Example in fedora
sudo firewall-cmd --add-port=8332/tcp --permanent
sudo firewall-cmd --reload
```

---

## Issue: Authentication Failure (HTTP 401 Unauthorized)

### Symptom
The application connects successfully but is rejected with an HTTP 401 Unauthorized error, indicating invalid credentials.

### Cause
The `RPC_USER` and `RPC_PASSWORD` in the `.env` file do not match the credentials configured in `bitcoin.conf`.

### Resolution
It is highly recommended to use the `rpcauth.py` script provided with Bitcoin Core to generate secure credentials.

1.  **Generate Credentials**: Run the script to create a username and a hashed password string.
```
bitcoin-28.1/share/rpcauth/rpcauth.py test
String to be appended to bitcoin.conf:
rpcauth=test:0a165b50506fe67ecf97286d1ee1112a$a14e74acde322c90c6c631f82d82ddf0c14d40da8fce0bcf5fec84cab6245252
Your password:
BxYpzjqDrADF8s_0FOeE287zS5BKUr8s4wUUZ2jrLVg
```
2.  **Update `bitcoin.conf`**: Add the generated `rpcauth` line to your `bitcoin.conf` file.
3.  **Update `.env` File**: Use the username you chose (`my_rpc_user`) and the **plain-text password** provided by the script in your `.env` file.
```
    RPC_USER=my_rpc_user
    RPC_PASSWORD=BxYpzjqDrADF8s_0FOeE287zS5BKUr8s4wUUZ2jrLVg
```
4.  **Restart `bitcoind`**: Restart the Bitcoin Core node to apply the new authentication settings.


