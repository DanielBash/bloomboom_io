import math
import random
import secrets

import settings


class Mob:
    def __init__(self, mob_data, game_state):
        self.data = mob_data
        self.game = game_state

    @property
    def other_mobs(self):
        return self.game.get('mobs', {})

    @classmethod
    def spawn_default(cls, **kwargs):
        mob = {
            'type': cls.__name__.lower(),
            'position': {'x': 0, 'y': 0, 'height': 0},
            'identity': secrets.token_urlsafe(16),
            'name': cls.__name__.lower(),
            'rotation': [0, 0, 0],
            'health': 100,
            'max_health': 100,
            'body_damage': 3,
            'rarity': 1,
            'healing_speed': 2
        }

        for i in kwargs:
            mob[i] = kwargs[i]
        return mob

    @classmethod
    def spawn(cls, **kwargs):
        return cls.spawn_default(**kwargs)

    def deal_damage(self, from_identity, amount):
        self.data['health'] -= amount
        return True

    def can_see(self, identity):
        other = self.other_mobs.get(identity)
        if not other:
            return False

        x0 = self.data['position']['x']
        y0 = self.data['position']['y']
        x1 = other['position']['x']
        y1 = other['position']['y']

        ix0, iy0 = math.floor(x0 + 0.5), math.floor(y0 + 0.5)
        ix1, iy1 = math.floor(x1 + 0.5), math.floor(y1 + 0.5)
        dx = abs(ix1 - ix0)
        dy = abs(iy1 - iy0)
        sx = 1 if ix0 < ix1 else -1
        sy = 1 if iy0 < iy1 else -1
        err = dx - dy
        cx, cy = ix0, iy0
        map_grid = self.game.get('map', [])

        while True:
            if (cx, cy) != (ix0, iy0) and (cx, cy) != (ix1, iy1):
                if 0 <= cy < len(map_grid) and 0 <= cx < len(map_grid[0]):
                    if map_grid[cy][cx] in settings.SOLID_BLOCKS:
                        return False
            if cx == ix1 and cy == iy1:
                break
            e2 = 2 * err
            if e2 > -dy:
                err -= dy
                cx += sx
            if e2 < dx:
                err += dx
                cy += sy
        return True

    def move(self, dx, dy, rotate=True):
        cur = self.data['position']
        map_grid = self.game.get('map', [])
        if not map_grid:
            return False

        start_x = cur['x']
        start_y = cur['y']
        moved = False

        step_x = 1 if dx > 0 else -1 if dx < 0 else 0
        remaining = abs(dx)
        while remaining > 0:
            step = min(1.0, remaining)
            nx = cur['x'] + step_x * step
            tx = math.floor(nx + 0.5)
            ty_cur = math.floor(cur['y'] + 0.5)

            if 0 <= ty_cur < len(map_grid) and 0 <= tx < len(map_grid[0]):
                if map_grid[ty_cur][tx] in settings.SOLID_BLOCKS:
                    break
            cur['x'] = nx
            moved = True
            remaining -= step

        step_y = 1 if dy > 0 else -1 if dy < 0 else 0
        remaining = abs(dy)
        while remaining > 0:
            step = min(1.0, remaining)
            ny = cur['y'] + step_y * step
            ty = math.floor(ny + 0.5)
            tx_cur = math.floor(cur['x'] + 0.5)

            if 0 <= ty < len(map_grid) and 0 <= tx_cur < len(map_grid[0]):
                if map_grid[ty][tx_cur] in settings.SOLID_BLOCKS:
                    break
            cur['y'] = ny
            moved = True
            remaining -= step

        if moved and rotate:
            real_dx = cur['x'] - start_x
            real_dy = cur['y'] - start_y
            yaw = math.atan2(-real_dx, -real_dy)
            self.data['rotation'] = [0, yaw, 0]

        return moved

    def update_position(self):
        pass

    def post_update(self):
        pass

    def pre_update(self):
        pass

    def update_collisions(self):
        self_x = self.data['position']['x']
        self_y = self.data['position']['y']
        self_h = self.data['position'].get('height', 0)

        self_radius = self.data.get('rarity', 0) * 0.2

        for mob in self.other_mobs.values():
            if mob['identity'] == self.data['identity']:
                continue

            mob_x = mob['position']['x']
            mob_y = mob['position']['y']
            mob_h = mob['position'].get('height', 0)
            mob_radius = mob.get('rarity', 0) * 0.2

            if abs(self_h - mob_h) > (self_radius + mob_radius):
                continue

            dx = mob_x - self_x
            dy = mob_y - self_y

            distance_sq = (dx ** 2) + (dy ** 2)
            min_distance = self_radius + mob_radius

            if (min_distance ** 2) > distance_sq > 0:
                distance = math.sqrt(distance_sq)

                overlap = min_distance - distance

                if distance == 0:
                    nx, ny = 1, 0
                else:
                    nx = dx / distance
                    ny = dy / distance

                push_x = nx * (overlap / 1.2)
                push_y = ny * (overlap / 1.2)

                self.data['position']['x'] -= push_x
                self.data['position']['y'] -= push_y

                mob['position']['x'] += push_x
                mob['position']['y'] += push_y
                mob['health'] -= self.data['body_damage']
                self.data['health'] -= mob['body_damage']

    def check_bounds(self):
        x = self.data['position']['x']
        y = self.data['position']['y']
        try:
            tile_standing = self.game['map'][math.floor(y + 0.5)][math.floor(x + 0.5)]
        except:
            tile_standing = "water"
        if tile_standing in settings.SOLID_BLOCKS:
            self.data["health"] = 0

    def update(self):
        self.pre_update()
        self.update_position()
        self.update_collisions()
        self.post_update()
        self.check_bounds()


class Flower(Mob):
    def post_update(self):
        self.data['health'] += self.data['healing_speed'] / settings.TPS
        if self.data['health'] > self.data['max_health']:
            self.data['health'] = self.data['max_health']


class Ladybug(Mob):
    def __init__(self, mob_data, game_state):
        super().__init__(mob_data, game_state)
        self.direction = random.uniform(0, 2 * math.pi)
        self.wobble_offset = random.uniform(0, 2 * math.pi)
        self.time = 0

    @classmethod
    def spawn(cls, **kwargs):
        data = cls.spawn_default(**kwargs)
        data['max_health'] = data['rarity'] * 20
        data['health'] = data['max_health']
        data['healing_speed'] = 0
        return data

    def update_position(self):
        max_health = self.data.get('max_health', 100)
        current_health = self.data['health']
        health_ratio = current_health / max_health if max_health > 0 else 1.0

        panic_factor = 1.0 + (1.0 - health_ratio) * 2.0
        base_speed = 0.5
        speed = base_speed * (panic_factor ** 2)
        speed_per_tick = speed / settings.TPS

        direction_change_chance = 0.01 + (1.0 - health_ratio) * 0.05
        if random.random() < direction_change_chance:
            angle_std = 0.2 + (1.0 - health_ratio) * 1.0
            self.direction += random.gauss(0, angle_std)
            self.direction %= 2 * math.pi

        self.time += 1
        wobble_freq = 0.1
        wobble_amp = 0.3 + (1.0 - health_ratio) * 1.1
        wobble = math.sin(self.time * wobble_freq + self.wobble_offset) * wobble_amp

        dir_x = math.cos(self.direction)
        dir_y = math.sin(self.direction)
        perp_x = -dir_y
        perp_y = dir_x

        dx = speed_per_tick * (dir_x + wobble * perp_x)
        dy = speed_per_tick * (dir_y + wobble * perp_y)

        cur_x = self.data['position']['x']
        cur_y = self.data['position']['y']
        new_x = cur_x + dx
        new_y = cur_y + dy

        tile_x = math.floor(new_x + 0.5)
        tile_y = math.floor(new_y + 0.5)
        map_grid = self.game['map']

        if 0 <= tile_y < len(map_grid) and 0 <= tile_x < len(map_grid[0]):
            tile = map_grid[tile_y][tile_x]
            if tile in settings.SOLID_BLOCKS:
                self.direction = (self.direction + math.pi) % (2 * math.pi)

                rev_dx = math.cos(self.direction)
                rev_dy = math.sin(self.direction)
                self.data['rotation'] = [0, math.atan2(-rev_dx, -rev_dy), 0]
                return

        self.data['position']['x'] = new_x
        self.data['position']['y'] = new_y

        yaw = math.atan2(-dx, -dy)
        self.data['rotation'] = [0, yaw, 0]

    def post_update(self):
        self.data['health'] += self.data['healing_speed'] / settings.TPS
        if self.data['health'] > self.data['max_health']:
            self.data['health'] = self.data['max_health']

class Dragonfly(Mob):
    def __init__(self, mob_data, game_state):
        super().__init__(mob_data, game_state)
        self.time = 0
        self.state = 'flying'
        self.base_height = mob_data['rarity'] * 1
        self.teleport_distance = mob_data['rarity'] * 5
        self.teleport_delay = math.floor(7 - mob_data['rarity'] * 0.5)

        mob_data['height'] = self.base_height

    @classmethod
    def spawn(cls, **kwargs):
        data = cls.spawn_default(**kwargs)
        data['max_health'] = data['rarity'] * 15
        data['health'] = data['max_health']
        data['body_damage'] = 10 + 3 * data['rarity']
        data['healing_speed'] = 3
        data['height'] = data['rarity'] * 1
        return data

    def update_position(self):
        self.time += 1

        if self.state == 'flying':
            self.data['position']['height'] =  self.base_height + math.sin(self.time * 0.5) * 2

        if self.time > settings.TPS:
            self.time = 0
            if random.randint(1, self.teleport_delay) == 1:
                dx = random.randint(-self.teleport_distance, self.teleport_distance)
                dy = random.randint(-self.teleport_distance, self.teleport_distance)
                self.move(dx, dy)
                self.data['height'] = self.base_height

class Grasshopper(Mob):
    def __init__(self, mob_data, game_state):
        super().__init__(mob_data, game_state)
        self.state = 'idle'
        self.idle_timer = 0
        self.idle_duration = random.randint(2, 5) * settings.TPS
        self.velocity_x = 0.0
        self.velocity_y = 0.0
        self.velocity_z = 0.0
        self.gravity = 25.0

    @classmethod
    def spawn(cls, **kwargs):
        data = cls.spawn_default(**kwargs)
        data['max_health'] = data['rarity'] * 30
        data['health'] = data['max_health']
        data['body_damage'] = 5 + data['rarity']
        data['healing_speed'] = 1
        return data

    def update_position(self):
        dt = 1.0 / settings.TPS

        if self.state == 'idle':
            self.idle_timer += 1
            if self.idle_timer >= self.idle_duration:
                angle = random.uniform(0, 2 * math.pi)
                distance = random.uniform(4, 10) + self.data['rarity'] * 2
                flight_time = random.uniform(0.7, 1.2)

                self.velocity_x = (math.cos(angle) * distance) / flight_time
                self.velocity_y = (math.sin(angle) * distance) / flight_time
                self.velocity_z = 0.5 * self.gravity * flight_time
                self.state = 'jumping'
            return

        dx = self.velocity_x * dt
        dy = self.velocity_y * dt
        self.move(dx, dy, rotate=True)

        new_height = self.data['position'].get('height', 0) + self.velocity_z * dt
        self.velocity_z -= self.gravity * dt

        if new_height <= 0 and self.velocity_z < 0:
            self.data['position']['height'] = 0
            self.state = 'idle'
            self.idle_timer = 0
            self.idle_duration = random.randint(2, 5) * settings.TPS
        else:
            self.data['position']['height'] = new_height

    def post_update(self):
        self.data['health'] += self.data['healing_speed'] / settings.TPS
        if self.data['health'] > self.data['max_health']:
            self.data['health'] = self.data['max_health']


class Spider(Mob):
    def __init__(self, mob_data, game_state):
        super().__init__(mob_data, game_state)
        self.target_identity = None
        self.search_timer = 0

    def find_target(self, require_visibility=False):
        mobs_list = list(self.other_mobs.values())
        if not mobs_list:
            return None
        for _ in range(10):
            candidate = random.choice(mobs_list)
            if candidate.get('identity') == self.data.get('identity'):
                continue
            if candidate.get('type') == 'flower':
                if not require_visibility or self.can_see(candidate['identity']):
                    return candidate['identity']
        return None

    def update_target(self):
        if self.target_identity is not None:
            if self.target_identity not in self.other_mobs:
                self.target_identity = None
                self.target_identity = self.find_target(require_visibility=True)
                self.search_timer = 0
                return
        if self.target_identity is None:
            self.search_timer += 1
            if self.search_timer >= settings.TPS:
                self.search_timer = 0
                self.target_identity = self.find_target(require_visibility=False)

    def post_update(self):
        self.data['health'] += self.data['healing_speed'] / settings.TPS
        if self.data['health'] > self.data['max_health']:
            self.data['health'] = self.data['max_health']


class Spiderkid(Spider):
    @classmethod
    def spawn(cls, **kwargs):
        data = cls.spawn_default(**kwargs)
        data['max_health'] = 8
        data['health'] = 8
        data['body_damage'] = 1
        data['healing_speed'] = 0
        data['rarity'] = 1
        return data

    def update_position(self):
        self.update_target()
        if self.target_identity is None:
            return
        target = self.other_mobs.get(self.target_identity)
        if not target:
            self.target_identity = None
            return

        speed = 1.8
        speed_per_tick = speed / settings.TPS

        dx = target['position']['x'] - self.data['position']['x']
        dy = target['position']['y'] - self.data['position']['y']
        distance = math.sqrt(dx * dx + dy * dy)

        if distance > 0:
            move_x = (dx / distance) * speed_per_tick
            move_y = (dy / distance) * speed_per_tick
            self.move(move_x, move_y)


class Spidermom(Spider):
    def __init__(self, mob_data, game_state):
        super().__init__(mob_data, game_state)
        self._kids_spawned = False

    @classmethod
    def spawn(cls, **kwargs):
        data = cls.spawn_default(**kwargs)
        data['max_health'] = data['rarity'] * 50
        data['health'] = data['max_health']
        data['body_damage'] = 3
        data['healing_speed'] = 2
        return data

    def update_position(self):
        self.update_target()
        if self.target_identity is None:
            return
        target = self.other_mobs.get(self.target_identity)
        if not target:
            self.target_identity = None
            return

        speed = 1.0
        speed_per_tick = speed / settings.TPS

        dx = self.data['position']['x'] - target['position']['x']
        dy = self.data['position']['y'] - target['position']['y']
        distance = math.sqrt(dx * dx + dy * dy)

        if distance > 0:
            move_x = (dx / distance) * speed_per_tick
            move_y = (dy / distance) * speed_per_tick
            self.move(-move_x, -move_y)

    def post_update(self):
        if self.data['health'] < 10:
            self.data['health'] = 0
            self._kids_spawned = True
            num_kids = 4 + self.data.get('rarity', 1) * 3
            for _ in range(num_kids):
                kid_data = Spiderkid.spawn(
                    position={
                        'x': self.data['position']['x'] + random.uniform(-1, 1),
                        'y': self.data['position']['y'] + random.uniform(-1, 1),
                        'height': 0,
                    },
                    rarity=1,
                )
                self.game['mobs'][kid_data['identity']] = kid_data
        return True