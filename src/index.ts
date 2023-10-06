// import { ChannelId, geckos } from "@geckos.io/server";
import { Server, Socket } from "socket.io";
import { v4 as uuid } from "uuid";
// const io = geckos();

const io = new Server(3000, {
  cors: {
    methods: ["GET", "POST"],
    credentials: true,
  },
});

let waitingId: string | undefined = undefined;
io.on("connection", (socket: Socket) => {
  socket.emit("connected", console.log(`${socket.id} connected`));

  socket.on("findMatch", () => {
    if (!waitingId) {
      waitingId = socket.id;
    } else {
      initMatch(waitingId, socket.id);
      waitingId = undefined;
    }
  });

  socket.on("move", (e) => {
    const { roomId, position, id } = e;
    const state = roomStates.get(roomId)!;
    const index = state.playerIds.indexOf(e.id);
    state.positions[index] = position;

    socket.to(roomId).emit("stateUpdate", state);
  });
});

interface RoomState {
  playerIds: [string, string];
  positions: [[number, number], [number, number]];
}

const roomStates = new Map<string, RoomState>();

const initMatch = (id1: string, id2: string) => {
  const roomId = uuid();
  roomStates.set(roomId, {
    playerIds: [id1, id2],
    positions: [
      [0, 0],
      [0, 0],
    ],
  });
  const channels = [id1, id2].map((id) => io.sockets.sockets.get(id)!);
  // console.log(
  //   "--------------------------------------------------------------------------"
  // );
  // console.log(id1, id2);
  // console.log(channels);

  channels.forEach((channel, index) => {
    channel.join(roomId);
    channel.emit("matchFound", {
      roomId,
      index,
      state: roomStates.get(roomId),
    });
  });
};
