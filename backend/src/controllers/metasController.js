const { sql, poolPromise } = require('../db/dbConnect');

// Obtener todas las metas con paginación o filtros
const getMetas = async (req, res) => {
    try {
        const { anio, mes, oficina_id, tipo_meta_id } = req.query;
        const pool = await poolPromise;

        let query = `
            SELECT m.*, t.Nombre as NombreTipoMeta
            FROM Metas_BuscadoresDeTrabajo m
            LEFT JOIN TipoMeta t ON m.TipoMetaId = t.TipoMetaId
            WHERE 1 = 1
        `;

        const request = pool.request();

        if (anio) {
            query += ` AND m.Anio = @anio`;
            request.input('anio', sql.Int, parseInt(anio));
        }
        if (mes) {
            query += ` AND m.IdMes = @mes`;
            request.input('mes', sql.Int, parseInt(mes));
        }
        if (oficina_id) {
            query += ` AND m.IdOficina = @oficina_id`;
            request.input('oficina_id', sql.Int, parseInt(oficina_id));
        }
        if (tipo_meta_id) {
            query += ` AND m.TipoMetaId = @tipo_meta_id`;
            request.input('tipo_meta_id', sql.Int, parseInt(tipo_meta_id));
        }

        query += ` ORDER BY m.Anio DESC, m.IdMes, m.Oficina, t.Nombre`;

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error al obtener metas:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// Crear o Actualizar una meta (Upsert usando el Unique Constraint)
const upsertMeta = async (req, res) => {
    try {
        const { 
            IdOficina, Oficina, IdMes, Mes, Anio, TipoMetaId, 
            MetaAtendidos, MetaVinculados, MetaColocados,
            PctAtendidos, PctVinculados, PctColocados, PctPlazasVacantes
        } = req.body;

        if (!IdOficina || !Oficina || !IdMes || !Mes || !Anio || !TipoMetaId) {
            return res.status(400).json({ message: 'Faltan parámetros requeridos.' });
        }

        const pool = await poolPromise;
        const request = pool.request();

        request.input('IdOficina', sql.Int, IdOficina);
        request.input('IdMes', sql.Int, IdMes);
        request.input('Anio', sql.Int, Anio);
        request.input('TipoMetaId', sql.Int, parseInt(TipoMetaId));
        request.input('Oficina', sql.NVarChar, Oficina);
        request.input('Mes', sql.NVarChar, Mes);
        request.input('MetaAtendidos', sql.Decimal(18,2), MetaAtendidos || 0);
        request.input('MetaVinculados', sql.Decimal(18,2), MetaVinculados || 0);
        request.input('MetaColocados', sql.Decimal(18,2), MetaColocados || 0);
        request.input('PctAtendidos', sql.Decimal(10,4), Number(PctAtendidos) || 0);
        request.input('PctVinculados', sql.Decimal(10,4), Number(PctVinculados) || 0);
        request.input('PctColocados', sql.Decimal(10,4), Number(PctColocados) || 0);
        request.input('PctPlazasVacantes', sql.Decimal(10,4), Number(PctPlazasVacantes) || 0);

        // Operación atómica MERGE (Upsert)
        const mergeQuery = `
            MERGE INTO Metas_BuscadoresDeTrabajo AS target
            USING (SELECT @IdOficina AS IdOficina, @IdMes AS IdMes, @Anio AS Anio, @TipoMetaId AS TipoMetaId) AS source
            ON (target.IdOficina = source.IdOficina AND target.IdMes = source.IdMes AND target.Anio = source.Anio AND target.TipoMetaId = source.TipoMetaId)
            WHEN MATCHED THEN
                UPDATE SET 
                    MetaAtendidos = @MetaAtendidos,
                    MetaVinculados = @MetaVinculados,
                    MetaColocados = @MetaColocados,
                    PctAtendidos = @PctAtendidos,
                    PctVinculados = @PctVinculados,
                    PctColocados = @PctColocados,
                    PctPlazasVacantes = @PctPlazasVacantes,
                    Oficina = @Oficina,
                    Mes = @Mes
            WHEN NOT MATCHED THEN
                INSERT (IdOficina, Oficina, IdMes, Mes, Anio, TipoMetaId, MetaAtendidos, MetaVinculados, MetaColocados, PctAtendidos, PctVinculados, PctColocados, PctPlazasVacantes)
                VALUES (@IdOficina, @Oficina, @IdMes, @Mes, @Anio, @TipoMetaId, @MetaAtendidos, @MetaVinculados, @MetaColocados, @PctAtendidos, @PctVinculados, @PctColocados, @PctPlazasVacantes);
        `;

        await request.query(mergeQuery);
        res.json({ message: 'Meta procesada correctamente (creada o actualizada).' });

    } catch (error) {
        console.error('Error al guardar la meta:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
};

// Eliminar meta
const deleteMeta = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        const request = pool.request();
        
        request.input('Id', sql.Int, id);
        await request.query('DELETE FROM Metas_BuscadoresDeTrabajo WHERE Id = @Id');

        res.json({ message: 'Meta eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar la meta:', error);
        res.status(500).json({ message: 'Error interno al eliminar' });
    }
};

module.exports = {
    getMetas,
    upsertMeta,
    deleteMeta
};