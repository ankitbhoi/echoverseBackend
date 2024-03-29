const RoomDto = require("../dtos/room-dto")
const roomService = require("../services/room-service")

class RoomsController {
    async create(req, res) {
        const { topic, roomType } = req.body

        if (!topic, !roomType) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const room = await roomService.create({ topic, roomType, ownerId: req.user._id })

        return res.status(200).json(new RoomDto(room));
    }

    async index(req, res) {
        const rooms = await roomService.getAllRooms(["open"])
        const allRooms = rooms.map(room => new RoomDto(room))
        return res.status(200).json(allRooms)
    }

    async show(req, res) {
        const room = await roomService.getRoom(req.params.roomId)
        if (!room) {
            return res.status(404).json({ message: "Room not found" })
        }
        return res.status(200).json(room)
    }
}

module.exports = new RoomsController();
