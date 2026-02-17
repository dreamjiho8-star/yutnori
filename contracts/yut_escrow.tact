import "@stdlib/deploy";
import "@stdlib/ownable";

// ============================================
// Messages
// ============================================

message CreateGame {
    roomCode: Int as uint64;
    betAmount: Int as coins;
    playerCount: Int as uint8;
}

message Deposit {
    roomCode: Int as uint64;
}

message SettlePayout {
    roomCode: Int as uint64;
    winner1: Address;
    winner2: Address?;
    winner3: Address?;
    winner4: Address?;
    winnerCount: Int as uint8;
}

message Refund {
    roomCode: Int as uint64;
}

// ============================================
// Structs
// ============================================

struct GameData {
    betAmount: Int as coins;
    playerCount: Int as uint8;
    depositCount: Int as uint8;
    gameActive: Bool;
    settled: Bool;
    createdAt: Int as uint32;
    totalDeposited: Int as coins;
    player1: Address;
    player2: Address;
    player3: Address;
    player4: Address;
    deposit1: Bool;
    deposit2: Bool;
    deposit3: Bool;
    deposit4: Bool;
}

// ============================================
// Contract
// ============================================

contract YutEscrow with Deployable, Ownable {
    owner: Address;
    games: map<Int, GameData>;
    platformFeeRate: Int as uint16; // basis points (500 = 5%)

    init(owner: Address) {
        self.owner = owner;
        self.platformFeeRate = 500; // 5%
    }

    // Create a new game escrow
    receive(msg: CreateGame) {
        self.requireOwner();
        require(msg.playerCount >= 2 && msg.playerCount <= 4, "Invalid player count");
        require(msg.betAmount > 0, "Bet amount must be positive");

        let existing: GameData? = self.games.get(msg.roomCode);
        require(existing == null, "Game already exists");

        let zeroAddr: Address = newAddress(0, 0);

        let game: GameData = GameData{
            betAmount: msg.betAmount,
            playerCount: msg.playerCount,
            depositCount: 0,
            gameActive: true,
            settled: false,
            createdAt: now(),
            totalDeposited: 0,
            player1: zeroAddr,
            player2: zeroAddr,
            player3: zeroAddr,
            player4: zeroAddr,
            deposit1: false,
            deposit2: false,
            deposit3: false,
            deposit4: false
        };

        self.games.set(msg.roomCode, game);
    }

    // Player deposits bet amount
    receive(msg: Deposit) {
        let game: GameData? = self.games.get(msg.roomCode);
        require(game != null, "Game not found");

        let g: GameData = game!!;
        require(g.gameActive, "Game not active");
        require(!g.settled, "Game already settled");

        let sender: Address = sender();
        let depositAmount: Int = context().value;

        // Allow small tolerance for gas: must send at least betAmount
        require(depositAmount >= g.betAmount, "Insufficient deposit amount");

        // Check player not already deposited & find slot
        let deposited: Bool = false;

        if (!g.deposit1 && g.depositCount < g.playerCount) {
            // Check if sender is already registered in another slot
            let alreadyIn: Bool = false;
            if (g.deposit2 && g.player2 == sender) { alreadyIn = true; }
            if (g.deposit3 && g.player3 == sender) { alreadyIn = true; }
            if (g.deposit4 && g.player4 == sender) { alreadyIn = true; }

            if (!alreadyIn) {
                if (g.player1 == newAddress(0, 0) || g.player1 == sender) {
                    g.player1 = sender;
                    g.deposit1 = true;
                    g.depositCount = g.depositCount + 1;
                    g.totalDeposited = g.totalDeposited + depositAmount;
                    deposited = true;
                }
            }
        }

        if (!deposited && !g.deposit2 && g.depositCount < g.playerCount) {
            let alreadyIn: Bool = false;
            if (g.deposit1 && g.player1 == sender) { alreadyIn = true; }
            if (g.deposit3 && g.player3 == sender) { alreadyIn = true; }
            if (g.deposit4 && g.player4 == sender) { alreadyIn = true; }

            if (!alreadyIn) {
                if (g.player2 == newAddress(0, 0) || g.player2 == sender) {
                    g.player2 = sender;
                    g.deposit2 = true;
                    g.depositCount = g.depositCount + 1;
                    g.totalDeposited = g.totalDeposited + depositAmount;
                    deposited = true;
                }
            }
        }

        if (!deposited && !g.deposit3 && g.depositCount < g.playerCount) {
            let alreadyIn: Bool = false;
            if (g.deposit1 && g.player1 == sender) { alreadyIn = true; }
            if (g.deposit2 && g.player2 == sender) { alreadyIn = true; }
            if (g.deposit4 && g.player4 == sender) { alreadyIn = true; }

            if (!alreadyIn) {
                if (g.player3 == newAddress(0, 0) || g.player3 == sender) {
                    g.player3 = sender;
                    g.deposit3 = true;
                    g.depositCount = g.depositCount + 1;
                    g.totalDeposited = g.totalDeposited + depositAmount;
                    deposited = true;
                }
            }
        }

        if (!deposited && !g.deposit4 && g.depositCount < g.playerCount) {
            let alreadyIn: Bool = false;
            if (g.deposit1 && g.player1 == sender) { alreadyIn = true; }
            if (g.deposit2 && g.player2 == sender) { alreadyIn = true; }
            if (g.deposit3 && g.player3 == sender) { alreadyIn = true; }

            if (!alreadyIn) {
                if (g.player4 == newAddress(0, 0) || g.player4 == sender) {
                    g.player4 = sender;
                    g.deposit4 = true;
                    g.depositCount = g.depositCount + 1;
                    g.totalDeposited = g.totalDeposited + depositAmount;
                    deposited = true;
                }
            }
        }

        require(deposited, "Cannot deposit: slots full or already deposited");

        self.games.set(msg.roomCode, g);
    }

    // Owner settles payout to winners
    receive(msg: SettlePayout) {
        self.requireOwner();

        let game: GameData? = self.games.get(msg.roomCode);
        require(game != null, "Game not found");

        let g: GameData = game!!;
        require(g.gameActive, "Game not active");
        require(!g.settled, "Already settled");
        require(msg.winnerCount >= 1 && msg.winnerCount <= 4, "Invalid winner count");

        g.settled = true;
        g.gameActive = false;
        self.games.set(msg.roomCode, g);

        // Calculate payout
        let totalPot: Int = g.totalDeposited;
        let fee: Int = totalPot * self.platformFeeRate / 10000;
        let payout: Int = totalPot - fee;
        let perWinner: Int = payout / msg.winnerCount;

        // Send to winners
        let gasPerSend: Int = ton("0.03");

        send(SendParameters{
            to: msg.winner1,
            value: perWinner - gasPerSend,
            mode: SendPayGasSeparately,
            body: "YutNori Win".asComment()
        });

        if (msg.winnerCount >= 2 && msg.winner2 != null) {
            send(SendParameters{
                to: msg.winner2!!,
                value: perWinner - gasPerSend,
                mode: SendPayGasSeparately,
                body: "YutNori Win".asComment()
            });
        }

        if (msg.winnerCount >= 3 && msg.winner3 != null) {
            send(SendParameters{
                to: msg.winner3!!,
                value: perWinner - gasPerSend,
                mode: SendPayGasSeparately,
                body: "YutNori Win".asComment()
            });
        }

        if (msg.winnerCount >= 4 && msg.winner4 != null) {
            send(SendParameters{
                to: msg.winner4!!,
                value: perWinner - gasPerSend,
                mode: SendPayGasSeparately,
                body: "YutNori Win".asComment()
            });
        }
    }

    // Owner refunds all deposited players
    receive(msg: Refund) {
        self.requireOwner();

        let game: GameData? = self.games.get(msg.roomCode);
        require(game != null, "Game not found");

        let g: GameData = game!!;
        require(!g.settled, "Already settled");

        g.settled = true;
        g.gameActive = false;
        self.games.set(msg.roomCode, g);

        let gasPerSend: Int = ton("0.03");

        if (g.deposit1) {
            send(SendParameters{
                to: g.player1,
                value: g.betAmount - gasPerSend,
                mode: SendPayGasSeparately,
                body: "YutNori Refund".asComment()
            });
        }
        if (g.deposit2) {
            send(SendParameters{
                to: g.player2,
                value: g.betAmount - gasPerSend,
                mode: SendPayGasSeparately,
                body: "YutNori Refund".asComment()
            });
        }
        if (g.deposit3) {
            send(SendParameters{
                to: g.player3,
                value: g.betAmount - gasPerSend,
                mode: SendPayGasSeparately,
                body: "YutNori Refund".asComment()
            });
        }
        if (g.deposit4) {
            send(SendParameters{
                to: g.player4,
                value: g.betAmount - gasPerSend,
                mode: SendPayGasSeparately,
                body: "YutNori Refund".asComment()
            });
        }
    }

    // Getters
    get fun gameData(roomCode: Int): GameData? {
        return self.games.get(roomCode);
    }

    get fun platformFeeRate(): Int {
        return self.platformFeeRate;
    }
}
